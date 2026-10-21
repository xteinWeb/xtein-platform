/*=============================================================================
  GHU-250 - Liquidación de prestaciones por terminación de contrato
  Procedimiento : dbo.spLiqPrestaciones
  Motor         : SQL Server 2016 o superior (OPENJSON / FOR JSON)

  Parámetros
    @ACCION     Acción a ejecutar:
                  'causas'             Causas de retiro (CAUSAS, ID_APLICACION = 'GHU-003').
                  'empresas'           Empresas patronales.
                  'grupos'             Grupos de empleados (ID_GRUPO_SUPERIOR = 'EMPLEADOS').
                  'empleados'          Empleados activos con su último contrato.
                  'preparar empleados' Empleados que cumplen el filtro del paso 1.
                  'prestaciones'       Ejecuta PLIQ_NOMINA, liquida las prestaciones
                                       solicitadas, las guarda en LIQUIDACION_OTROS y
                                       devuelve el resultado consolidado.
                  'ajustes'            Guarda los valores modificados en la grilla del
                                       paso 3 y recalcula LCJ.
    @DATA_JSON  Objeto JSON con los filtros/datos:
                  {
                    "ID_UN": "00",
                    "USUARIO": "XTEIN",
                    "CLASE_LIQUIDACION": ["LCJ","LPS","LVS","LCS","LIN"],
                    "FECHA_RETIRO": "2026-10-09",
                    "ID_CAUSA": "...",
                    "ID_EMPRESA": "...",
                    "ID_GRUPO": "...",
                    "LISTA_EMPLEADOS": ["111","222"],
                    "AJUSTES": [{ "ID_EMPLEADO": "111", "ORIGEN": "OTROS",
                                  "ID_CONCEPTO": "LPS", "VALOR": 1000 }],   -- solo 'ajustes'
                    "CONSECUTIVO": 240                                     -- solo 'ajustes'
                  }

  Respuesta
    Un único conjunto de resultados con la columna DATA (cadena JSON, siempre un
    arreglo). Los errores de negocio se devuelven como [{"ErrMensaje":"..."}],
    igual que el resto de aplicaciones XTEIN.

  Reglas de liquidación (legislación laboral colombiana - CST)
    Días base    : por cada mes, MAX(DIAS) de LIQUIDACION_NOMINA + días de novedad
                   (VALOR_NOVEDAD) de incapacidades (ICI / INC) y vacaciones (VAC),
                   con tope de 30 días por mes.
    Base prest.  : promedio mensual de devengados con BASE_SALARIAL = 1 en el periodo
                   (mínimo el salario básico) + auxilio de transporte cuando el
                   salario básico <= 2 SMMLV (Ley 1 de 1963, art. 7).
    LPS Prima    : Base * días del semestre / 360                    (CST art. 306)
    LCS Cesantía : Base * días del año / 360                         (CST art. 249)
    LIN Intereses: Cesantía * días del año * 12% / 360               (Ley 52 de 1975)
    LVS Vacación : Salario básico * días del contrato / 720, menos los días de
                   vacaciones (VAC) ya disfrutados                   (CST art. 186 y 189)
    LCJ Contrato : Sólo si se elige "Finalización de contrato": neto de los
                   devengados menos los deducidos de nómina y prestaciones.

  >>> SUPUESTOS DE ESQUEMA - VERIFICAR ANTES DE DESPLEGAR <<<
    RS_EMPLEADOS_ID : ID_EMPLEADO, NOMBRE, ESTADO
    RS_CONTRATOS_ID : ID_UN, ID_EMPLEADO, INDICE, FECHA_INICIAL, FECHA_FINAL,
                      ID_EMPRESA, ID_GRUPO, SALARIO
    LIQUIDACION_NOMINA : mismas columnas que LIQUIDACION_OTROS.
    CAUSAS          : ID_CAUSA, DESCRIPCION, ID_APLICACION
    EMPRESAS_PATRONALES : ID_EMPRESA, NOMBRE
    GRUPOS          : ID_GRUPO, ID_GRUPO_SUPERIOR
    Los únicos puntos que dependen de RS_EMPLEADOS_ID / RS_CONTRATOS_ID son la
    tabla temporal #CONTRATOS (bloque "CONTRATOS VIGENTES") y las listas.
=============================================================================*/
CREATE OR ALTER PROCEDURE dbo.spLiqPrestaciones
  @ACCION     NVARCHAR(50),
  @DATA_JSON  NVARCHAR(MAX) = N'{}'
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE
    @APLICACION      NVARCHAR(20)  = N'GHU-250',
    @ID_LIQUIDACION  NVARCHAR(20)  = N'010',
    @APLICACION_NOM  NVARCHAR(20)  = N'GHU-027',
    @ID_PERIODO      NVARCHAR(20)  = N'MENSUAL',
    @ID_DOCUMENTO    NVARCHAR(20)  = N'NOM',
    @PREFIJO         NVARCHAR(20)  = N'SIN',
    @SUFIJO          NVARCHAR(20)  = N'SIN',
    @PARAMETROS_NOM  NVARCHAR(400) = N'BORRAR^0|PROCESO^1525885998|~|EXCLUIR^|PERIODO_BASE^12/30/1899^12/30/1899',
    @TASA_INTERESES  DECIMAL(9,4)  = 0.12,
    @DIAS_VAC_ANIO   DECIMAL(9,4)  = 15;

  DECLARE
    @ACC             NVARCHAR(50)  = LOWER(LTRIM(RTRIM(ISNULL(@ACCION, N'')))),
    @ID_UN           NVARCHAR(20),
    @USUARIO         NVARCHAR(50),
    @FECHA_RETIRO    DATE,
    @ID_CAUSA        NVARCHAR(50),
    @ID_EMPRESA      NVARCHAR(50),
    @ID_GRUPO        NVARCHAR(50),
    @SMMLV           DECIMAL(18,2),
    @AUX_TRANSPORTE  DECIMAL(18,2),
    @CONSECUTIVO     DECIMAL(18,0),
    @ERR             NVARCHAR(4000);

  BEGIN TRY

    IF ISJSON(ISNULL(@DATA_JSON, N'')) = 0
      SET @DATA_JSON = N'{}';

    SELECT
      @ID_UN          = ISNULL(NULLIF(JSON_VALUE(@DATA_JSON, '$.ID_UN'), N''), N'00'),
      @USUARIO        = ISNULL(NULLIF(JSON_VALUE(@DATA_JSON, '$.USUARIO'), N''), N'XTEIN'),
      @FECHA_RETIRO   = TRY_CONVERT(DATE, LEFT(JSON_VALUE(@DATA_JSON, '$.FECHA_RETIRO'), 10), 23),
      @ID_CAUSA       = NULLIF(JSON_VALUE(@DATA_JSON, '$.ID_CAUSA'), N''),
      @ID_EMPRESA     = NULLIF(JSON_VALUE(@DATA_JSON, '$.ID_EMPRESA'), N''),
      @ID_GRUPO       = NULLIF(JSON_VALUE(@DATA_JSON, '$.ID_GRUPO'), N''),
      -- Valores 2026 por defecto; pueden enviarse en @DATA_JSON. Verificar decreto vigente.
      @SMMLV          = ISNULL(TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(@DATA_JSON, '$.SMMLV')), 1750905),
      @AUX_TRANSPORTE = ISNULL(TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(@DATA_JSON, '$.AUXILIO_TRANSPORTE')), 249095),
      @CONSECUTIVO    = TRY_CONVERT(DECIMAL(18,0), JSON_VALUE(@DATA_JSON, '$.CONSECUTIVO'));


    /*=========================================================================
      LISTAS
    =========================================================================*/
    IF @ACC = N'causas'
    BEGIN
      SELECT DATA = ISNULL((
        SELECT C.ID_CAUSA, C.DESCRIPCION
        FROM CAUSAS C
        WHERE C.ID_APLICACION = N'GHU-003'
        ORDER BY C.DESCRIPCION
        FOR JSON PATH, INCLUDE_NULL_VALUES), N'[]');
      RETURN;
    END;

    IF @ACC = N'empresas'
    BEGIN
      SELECT DATA = ISNULL((
        SELECT E.ID_EMPRESA, E.NOMBRE
        FROM EMPRESAS_PATRONALES E
        ORDER BY E.NOMBRE
        FOR JSON PATH, INCLUDE_NULL_VALUES), N'[]');
      RETURN;
    END;

    IF @ACC = N'grupos'
    BEGIN
      SELECT DATA = ISNULL((
        SELECT G.ID_GRUPO
        FROM GRUPOS G
        WHERE G.ID_GRUPO_SUPERIOR = N'EMPLEADOS'
        ORDER BY G.ID_GRUPO
        FOR JSON PATH, INCLUDE_NULL_VALUES), N'[]');
      RETURN;
    END;


    /*=========================================================================
      FILTRO DE EMPLEADOS (LISTA_EMPLEADOS)
    =========================================================================*/
    CREATE TABLE #FILTRO_EMPLEADOS (ID_EMPLEADO NVARCHAR(50) COLLATE DATABASE_DEFAULT PRIMARY KEY);

    INSERT INTO #FILTRO_EMPLEADOS (ID_EMPLEADO)
    SELECT DISTINCT LTRIM(RTRIM(J.[value]))
    FROM OPENJSON(@DATA_JSON, '$.LISTA_EMPLEADOS') J
    WHERE J.[type] IN (1, 2) AND LTRIM(RTRIM(J.[value])) <> N'';

    DECLARE @HAY_FILTRO_EMPLEADOS BIT =
      CASE WHEN EXISTS (SELECT 1 FROM #FILTRO_EMPLEADOS) THEN 1 ELSE 0 END;


    /*=========================================================================
      CONTRATOS VIGENTES
      Último contrato (mayor INDICE) de cada empleado activo.
      >>> Único bloque a ajustar si cambian los nombres de RS_*_ID <<<
    =========================================================================*/
    CREATE TABLE #CONTRATOS (
      ID_EMPLEADO   NVARCHAR(50)  COLLATE DATABASE_DEFAULT PRIMARY KEY,
      NOMBRE        NVARCHAR(200) COLLATE DATABASE_DEFAULT,
      FECHA_INICIAL DATE,
      FECHA_FINAL   DATE,
      ID_EMPRESA    NVARCHAR(50)  COLLATE DATABASE_DEFAULT,
      ID_GRUPO      NVARCHAR(50)  COLLATE DATABASE_DEFAULT,
      SALARIO       DECIMAL(18,2)
    );

    ;WITH ULTIMO AS (
      SELECT
        C.ID_EMPLEADO, C.FECHA_INICIAL, C.FECHA_FINAL, C.ID_EMPRESA, C.ID_GRUPO, C.SALARIO,
        RN = ROW_NUMBER() OVER (PARTITION BY C.ID_EMPLEADO ORDER BY C.INDICE DESC)
      FROM RS_CONTRATOS_ID C
      WHERE C.ID_UN = @ID_UN
    )
    INSERT INTO #CONTRATOS (ID_EMPLEADO, NOMBRE, FECHA_INICIAL, FECHA_FINAL, ID_EMPRESA, ID_GRUPO, SALARIO)
    SELECT U.ID_EMPLEADO, E.NOMBRE, U.FECHA_INICIAL, U.FECHA_FINAL, U.ID_EMPRESA, U.ID_GRUPO, ISNULL(U.SALARIO, 0)
    FROM ULTIMO U
    INNER JOIN RS_EMPLEADOS_ID E ON E.ID_EMPLEADO = U.ID_EMPLEADO
    WHERE U.RN = 1
      AND UPPER(E.ESTADO) = N'ACTIVO';


    /*=========================================================================
      EMPLEADOS / PREPARAR EMPLEADOS
    =========================================================================*/
    IF @ACC IN (N'empleados', N'preparar empleados')
    BEGIN
      IF @ACC = N'preparar empleados' AND @FECHA_RETIRO IS NULL
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = N'La fecha de terminación del contrato es requerida.' FOR JSON PATH);
        RETURN;
      END;

      DECLARE @FECHA_CORTE DATE = ISNULL(@FECHA_RETIRO, CAST(GETDATE() AS DATE));

      SELECT DATA = ISNULL((
        SELECT
          C.ID_EMPLEADO,
          C.NOMBRE,
          FECHA_INICIAL = CONVERT(CHAR(10), C.FECHA_INICIAL, 23),
          FECHA_FINAL   = CONVERT(CHAR(10), C.FECHA_FINAL, 23),
          DIAS          = D.DIAS360
        FROM #CONTRATOS C
        CROSS APPLY (
          SELECT DIAS360 =
            (YEAR(@FECHA_CORTE) - YEAR(C.FECHA_INICIAL)) * 360
            + (MONTH(@FECHA_CORTE) - MONTH(C.FECHA_INICIAL)) * 30
            + (CASE WHEN @FECHA_CORTE = EOMONTH(@FECHA_CORTE) OR DAY(@FECHA_CORTE) > 30 THEN 30 ELSE DAY(@FECHA_CORTE) END)
            - (CASE WHEN DAY(C.FECHA_INICIAL) > 30 THEN 30 ELSE DAY(C.FECHA_INICIAL) END)
            + 1
        ) D
        WHERE C.FECHA_INICIAL <= @FECHA_CORTE
          AND (@ID_EMPRESA IS NULL OR C.ID_EMPRESA = @ID_EMPRESA)
          AND (@ID_GRUPO   IS NULL OR C.ID_GRUPO   = @ID_GRUPO)
          AND (@ACC = N'empleados'
               OR @HAY_FILTRO_EMPLEADOS = 0
               OR C.ID_EMPLEADO IN (SELECT F.ID_EMPLEADO FROM #FILTRO_EMPLEADOS F))
        ORDER BY C.NOMBRE
        FOR JSON PATH, INCLUDE_NULL_VALUES), N'[]');
      RETURN;
    END;


    /*=========================================================================
      PRESTACIONES
    =========================================================================*/
    IF @ACC = N'prestaciones'
    BEGIN

      IF @FECHA_RETIRO IS NULL
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = N'La fecha de terminación del contrato es requerida.' FOR JSON PATH);
        RETURN;
      END;

      IF @HAY_FILTRO_EMPLEADOS = 0
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = N'Debe seleccionar al menos un empleado.' FOR JSON PATH);
        RETURN;
      END;

      -- Clases solicitadas. "Finalización de contrato" (LCJ) implica todas las prestaciones.
      CREATE TABLE #CLASES (ID_CONCEPTO NVARCHAR(10) COLLATE DATABASE_DEFAULT PRIMARY KEY);

      INSERT INTO #CLASES (ID_CONCEPTO)
      SELECT DISTINCT UPPER(LTRIM(RTRIM(J.[value])))
      FROM OPENJSON(@DATA_JSON, '$.CLASE_LIQUIDACION') J
      WHERE UPPER(LTRIM(RTRIM(J.[value]))) IN (N'LCJ', N'LPS', N'LCS', N'LIN', N'LVS');

      IF NOT EXISTS (SELECT 1 FROM #CLASES)
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = N'Debe seleccionar al menos una clase de liquidación.' FOR JSON PATH);
        RETURN;
      END;

      DECLARE @ES_CONTRATO BIT = CASE WHEN EXISTS (SELECT 1 FROM #CLASES WHERE ID_CONCEPTO = N'LCJ') THEN 1 ELSE 0 END;

      IF @ES_CONTRATO = 1
        INSERT INTO #CLASES (ID_CONCEPTO)
        SELECT V.ID_CONCEPTO
        FROM (VALUES (N'LPS'), (N'LCS'), (N'LIN'), (N'LVS')) V(ID_CONCEPTO)
        WHERE NOT EXISTS (SELECT 1 FROM #CLASES C WHERE C.ID_CONCEPTO = V.ID_CONCEPTO);

      -- Intereses de cesantías requieren calcular la cesantía (aunque no se guarde).
      DECLARE @GUARDA_LCS BIT = CASE WHEN EXISTS (SELECT 1 FROM #CLASES WHERE ID_CONCEPTO = N'LCS') THEN 1 ELSE 0 END;

      -- Empleados válidos: seleccionados y con contrato vigente a la fecha de retiro.
      CREATE TABLE #EMP (
        ID_EMPLEADO   NVARCHAR(50)  COLLATE DATABASE_DEFAULT PRIMARY KEY,
        NOMBRE        NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        FECHA_INICIAL DATE,
        FECHA_FINAL   DATE,
        ID_EMPRESA    NVARCHAR(50)  COLLATE DATABASE_DEFAULT,
        SALARIO       DECIMAL(18,2),
        AUXILIO       DECIMAL(18,2) DEFAULT 0
      );

      INSERT INTO #EMP (ID_EMPLEADO, NOMBRE, FECHA_INICIAL, FECHA_FINAL, ID_EMPRESA, SALARIO, AUXILIO)
      SELECT C.ID_EMPLEADO, C.NOMBRE, C.FECHA_INICIAL, C.FECHA_FINAL, C.ID_EMPRESA, C.SALARIO,
             CASE WHEN C.SALARIO <= 2 * @SMMLV THEN @AUX_TRANSPORTE ELSE 0 END
      FROM #CONTRATOS C
      INNER JOIN #FILTRO_EMPLEADOS F ON F.ID_EMPLEADO = C.ID_EMPLEADO
      WHERE C.FECHA_INICIAL <= @FECHA_RETIRO;

      IF NOT EXISTS (SELECT 1 FROM #EMP)
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = N'Ninguno de los empleados seleccionados tiene un contrato vigente a la fecha de retiro.' FOR JSON PATH);
        RETURN;
      END;


      /*-----------------------------------------------------------------------
        1. Limpieza de corridas previas de GHU-250 para los mismos empleados y
           fecha de retiro (en ambas tablas) para que la liquidación sea
           repetible sin duplicar valores.
      -----------------------------------------------------------------------*/
      CREATE TABLE #PREVIAS (ID_EMPLEADO NVARCHAR(50) COLLATE DATABASE_DEFAULT, CONSECUTIVO DECIMAL(18,0));

      INSERT INTO #PREVIAS (ID_EMPLEADO, CONSECUTIVO)
      SELECT DISTINCT O.ID_EMPLEADO, O.CONSECUTIVO
      FROM LIQUIDACION_OTROS O
      INNER JOIN #EMP E ON E.ID_EMPLEADO = O.ID_EMPLEADO
      WHERE O.ID_UN = @ID_UN
        AND O.ID_APLICACION = @APLICACION
        AND O.FECHA = @FECHA_RETIRO;

      BEGIN TRANSACTION;

        DELETE N
        FROM LIQUIDACION_NOMINA N
        INNER JOIN #PREVIAS P ON P.ID_EMPLEADO = N.ID_EMPLEADO AND P.CONSECUTIVO = N.CONSECUTIVO
        WHERE N.ID_UN = @ID_UN
          AND N.ID_LIQUIDACION = @ID_LIQUIDACION
          AND N.ID_DOCUMENTO = @ID_DOCUMENTO;

        DELETE O
        FROM LIQUIDACION_OTROS O
        INNER JOIN #PREVIAS P ON P.ID_EMPLEADO = O.ID_EMPLEADO AND P.CONSECUTIVO = O.CONSECUTIVO
        WHERE O.ID_UN = @ID_UN
          AND O.ID_APLICACION = @APLICACION;

      COMMIT TRANSACTION;


      /*-----------------------------------------------------------------------
        2. Liquidación de la nómina de los días trabajados (PLIQ_NOMINA).
      -----------------------------------------------------------------------*/
      SELECT @CONSECUTIVO = ISNULL(MAX(T.CONSECUTIVO), 0) + 1
      FROM (
        SELECT CONSECUTIVO FROM LIQUIDACION_NOMINA WHERE ID_UN = @ID_UN AND ID_DOCUMENTO = @ID_DOCUMENTO
        UNION ALL
        SELECT CONSECUTIVO FROM LIQUIDACION_OTROS  WHERE ID_UN = @ID_UN AND ID_DOCUMENTO = @ID_DOCUMENTO
      ) T;

      DECLARE
        @FECHA_LIQ_NOM      SMALLDATETIME = @FECHA_RETIRO,
        @FECHA_INICIAL_LIQ  SMALLDATETIME = DATEFROMPARTS(YEAR(@FECHA_RETIRO), MONTH(@FECHA_RETIRO), 1),
        @FECHA_FINAL_LIQ    SMALLDATETIME = EOMONTH(@FECHA_RETIRO),
        @FILTRO             NVARCHAR(MAX),
        @ERR_PLIQ           NVARCHAR(4000) = N'';

      -- RS_CONTRATOS_ID.ID_UN = '00' AND RS_CONTRATOS_ID.ID_EMPLEADO IN ('111','222',...)
      SET @FILTRO =
        N'RS_CONTRATOS_ID.ID_UN = ''' + REPLACE(@ID_UN, N'''', N'''''') + N''''
        + N' AND RS_CONTRATOS_ID.ID_EMPLEADO IN ('
        + STUFF((
            SELECT N',''' + REPLACE(E.ID_EMPLEADO, N'''', N'''''') + N''''
            FROM #EMP E
            ORDER BY E.ID_EMPLEADO
            FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N'')
        + N')';

      EXEC PLIQ_NOMINA
        @ID_UN,
        @ID_LIQUIDACION,
        @APLICACION_NOM,
        @ID_PERIODO,
        N'DIAS',
        1,
        @FECHA_LIQ_NOM,
        @FECHA_INICIAL_LIQ,
        @FECHA_FINAL_LIQ,
        @FILTRO,
        @USUARIO,
        @PARAMETROS_NOM,
        @ID_DOCUMENTO,
        @PREFIJO,
        @CONSECUTIVO,
        @SUFIJO,
        N'',
        @ERR_PLIQ;

      IF NULLIF(LTRIM(RTRIM(@ERR_PLIQ)), N'') IS NOT NULL
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = @ERR_PLIQ FOR JSON PATH);
        RETURN;
      END;


      /*-----------------------------------------------------------------------
        3. Días base por mes (MAX(DIAS) + novedades ICI/INC/VAC, tope 30).
      -----------------------------------------------------------------------*/
      CREATE TABLE #DIAS_MES (
        ID_EMPLEADO NVARCHAR(50) COLLATE DATABASE_DEFAULT,
        MES         DATE,
        DIAS        DECIMAL(9,2),
        DIAS_VAC    DECIMAL(9,2),
        PRIMARY KEY (ID_EMPLEADO, MES)
      );

      INSERT INTO #DIAS_MES (ID_EMPLEADO, MES, DIAS, DIAS_VAC)
      SELECT
        N.ID_EMPLEADO,
        MES = DATEFROMPARTS(YEAR(N.FECHA_FINAL), MONTH(N.FECHA_FINAL), 1),
        DIAS = CASE
                 WHEN MAX(ISNULL(N.DIAS, 0))
                      + SUM(CASE WHEN N.ID_CONCEPTO IN (N'ICI', N'INC', N'VAC') THEN ISNULL(N.VALOR_NOVEDAD, 0) ELSE 0 END) > 30
                   THEN 30
                 ELSE MAX(ISNULL(N.DIAS, 0))
                      + SUM(CASE WHEN N.ID_CONCEPTO IN (N'ICI', N'INC', N'VAC') THEN ISNULL(N.VALOR_NOVEDAD, 0) ELSE 0 END)
               END,
        DIAS_VAC = SUM(CASE WHEN N.ID_CONCEPTO = N'VAC' THEN ISNULL(N.VALOR_NOVEDAD, 0) ELSE 0 END)
      FROM LIQUIDACION_NOMINA N
      INNER JOIN #EMP E ON E.ID_EMPLEADO = N.ID_EMPLEADO
      WHERE N.ID_UN = @ID_UN
        AND N.FECHA_FINAL >= E.FECHA_INICIAL
        AND N.FECHA_FINAL <  DATEADD(DAY, 1, EOMONTH(@FECHA_RETIRO))
      GROUP BY N.ID_EMPLEADO, DATEFROMPARTS(YEAR(N.FECHA_FINAL), MONTH(N.FECHA_FINAL), 1);


      /*-----------------------------------------------------------------------
        4. Periodos, días y bases por concepto.
      -----------------------------------------------------------------------*/
      CREATE TABLE #CALC (
        ID_EMPLEADO   NVARCHAR(50) COLLATE DATABASE_DEFAULT,
        ID_CONCEPTO   NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        FECHA_DESDE   DATE,
        FECHA_HASTA   DATE,
        DIAS_PERIODO  DECIMAL(9,2),
        DIAS          DECIMAL(9,2),
        VALOR_BASE    DECIMAL(18,2),
        VALOR         DECIMAL(18,2),
        DETALLE       NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        PRIMARY KEY (ID_EMPLEADO, ID_CONCEPTO)
      );

      -- Periodo de cada concepto
      INSERT INTO #CALC (ID_EMPLEADO, ID_CONCEPTO, FECHA_DESDE, FECHA_HASTA, DETALLE)
      SELECT E.ID_EMPLEADO, P.ID_CONCEPTO,
             CASE WHEN E.FECHA_INICIAL > P.INICIO THEN E.FECHA_INICIAL ELSE P.INICIO END,
             @FECHA_RETIRO, P.DETALLE
      FROM #EMP E
      CROSS APPLY (VALUES
        (N'LPS', DATEFROMPARTS(YEAR(@FECHA_RETIRO), CASE WHEN MONTH(@FECHA_RETIRO) <= 6 THEN 1 ELSE 7 END, 1), N'Prima de servicios'),
        (N'LCS', DATEFROMPARTS(YEAR(@FECHA_RETIRO), 1, 1), N'Cesantías'),
        (N'LIN', DATEFROMPARTS(YEAR(@FECHA_RETIRO), 1, 1), N'Intereses sobre cesantías'),
        (N'LVS', E.FECHA_INICIAL, N'Vacaciones compensadas')
      ) P(ID_CONCEPTO, INICIO, DETALLE)
      WHERE P.ID_CONCEPTO IN (SELECT ID_CONCEPTO FROM #CLASES)
         OR (P.ID_CONCEPTO = N'LCS' AND EXISTS (SELECT 1 FROM #CLASES WHERE ID_CONCEPTO = N'LIN'));

      -- Días calendario comerciales del periodo (DAYS360 inclusivo) y días base de nómina
      UPDATE C SET
        DIAS_PERIODO =
            (YEAR(C.FECHA_HASTA) - YEAR(C.FECHA_DESDE)) * 360
          + (MONTH(C.FECHA_HASTA) - MONTH(C.FECHA_DESDE)) * 30
          + (CASE WHEN C.FECHA_HASTA = EOMONTH(C.FECHA_HASTA) OR DAY(C.FECHA_HASTA) > 30 THEN 30 ELSE DAY(C.FECHA_HASTA) END)
          - (CASE WHEN DAY(C.FECHA_DESDE) > 30 THEN 30 ELSE DAY(C.FECHA_DESDE) END)
          + 1,
        DIAS = ISNULL((
          SELECT SUM(D.DIAS)
          FROM #DIAS_MES D
          WHERE D.ID_EMPLEADO = C.ID_EMPLEADO
            AND D.MES >= DATEFROMPARTS(YEAR(C.FECHA_DESDE), MONTH(C.FECHA_DESDE), 1)
            AND D.MES <= DATEFROMPARTS(YEAR(C.FECHA_HASTA), MONTH(C.FECHA_HASTA), 1)), 0)
      FROM #CALC C;

      -- Los días de nómina nunca superan los días comerciales del periodo
      UPDATE #CALC SET DIAS = DIAS_PERIODO WHERE DIAS > DIAS_PERIODO;

      -- Base prestacional (prima, cesantías, intereses): promedio de devengados salariales
      -- del periodo, mínimo el salario básico, más auxilio de transporte cuando aplica.
      UPDATE C SET
        VALOR_BASE = B.BASE + E.AUXILIO
      FROM #CALC C
      INNER JOIN #EMP E ON E.ID_EMPLEADO = C.ID_EMPLEADO
      CROSS APPLY (
        SELECT SUMA = SUM(ISNULL(N.VALOR, 0))
        FROM LIQUIDACION_NOMINA N
        WHERE N.ID_UN = @ID_UN
          AND N.ID_EMPLEADO = C.ID_EMPLEADO
          AND N.BASE_SALARIAL = 1
          AND UPPER(N.TIPO_VALOR) = N'DEVENGADO'
          AND N.FECHA_FINAL >= C.FECHA_DESDE
          AND N.FECHA_FINAL <  DATEADD(DAY, 1, EOMONTH(C.FECHA_HASTA))
      ) S
      CROSS APPLY (
        SELECT BASE = CASE
          WHEN C.DIAS > 0 AND ISNULL(S.SUMA, 0) * 30 / C.DIAS > E.SALARIO
            THEN ROUND(ISNULL(S.SUMA, 0) * 30 / C.DIAS, 0)
          ELSE E.SALARIO END
      ) B
      WHERE C.ID_CONCEPTO IN (N'LPS', N'LCS', N'LIN');

      -- Vacaciones: salario básico ordinario
      UPDATE C SET VALOR_BASE = E.SALARIO
      FROM #CALC C
      INNER JOIN #EMP E ON E.ID_EMPLEADO = C.ID_EMPLEADO
      WHERE C.ID_CONCEPTO = N'LVS';

      -- Prima y cesantías
      UPDATE #CALC SET VALOR = ROUND(VALOR_BASE * DIAS / 360, 0)
      WHERE ID_CONCEPTO IN (N'LPS', N'LCS');

      -- Intereses sobre cesantías
      UPDATE I SET
        VALOR = ROUND(C.VALOR * I.DIAS * @TASA_INTERESES / 360, 0)
      FROM #CALC I
      INNER JOIN #CALC C ON C.ID_EMPLEADO = I.ID_EMPLEADO AND C.ID_CONCEPTO = N'LCS'
      WHERE I.ID_CONCEPTO = N'LIN';

      -- Vacaciones: días causados (15 hábiles por año) menos los disfrutados
      UPDATE C SET
        DIAS  = V.PENDIENTES,
        VALOR = ROUND(C.VALOR_BASE / 30 * V.PENDIENTES, 0)
      FROM #CALC C
      CROSS APPLY (
        SELECT PENDIENTES = CASE WHEN X.CAUSADOS - X.DISFRUTADOS < 0 THEN 0
                                 ELSE ROUND(X.CAUSADOS - X.DISFRUTADOS, 2) END
        FROM (
          SELECT CAUSADOS    = C.DIAS * @DIAS_VAC_ANIO / 360,
                 DISFRUTADOS = ISNULL((SELECT SUM(D.DIAS_VAC) FROM #DIAS_MES D
                                       WHERE D.ID_EMPLEADO = C.ID_EMPLEADO), 0)
        ) X
      ) V
      WHERE C.ID_CONCEPTO = N'LVS';

      -- La cesantía calculada sólo para los intereses no se guarda
      IF @GUARDA_LCS = 0
        DELETE FROM #CALC WHERE ID_CONCEPTO = N'LCS';


      /*-----------------------------------------------------------------------
        5. Persistencia en LIQUIDACION_OTROS.
      -----------------------------------------------------------------------*/
      DECLARE @AHORA DATETIME = GETDATE();

      BEGIN TRANSACTION;

        INSERT INTO LIQUIDACION_OTROS (
          ID_UN, ID_LIQUIDACION, ID_EMPLEADO, ID_APLICACION, ID_PERIODO, ID_CONCEPTO,
          FECHA, HORA, ITEM, ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO,
          VALOR_BASE, REMUNERACION, FECHA_INICIAL, FECHA_FINAL, DIAS, DIAS_PERIODO,
          TIPO, TIPO_VALOR, VALOR, VALOR_EMPRESA, VALOR_NOVEDAD, NETO, USUARIO,
          BASE_SALARIAL, BASE_APORTES, ID_EMPRESA, ID_UN_ITEM, DETALLE,
          FECHA_DESDE, FECHA_HASTA)
        SELECT
          @ID_UN, @ID_LIQUIDACION, C.ID_EMPLEADO, @APLICACION, @ID_PERIODO, C.ID_CONCEPTO,
          @FECHA_RETIRO, @AHORA,
          ROW_NUMBER() OVER (PARTITION BY C.ID_EMPLEADO ORDER BY C.ID_CONCEPTO),
          @ID_DOCUMENTO, @PREFIJO, @CONSECUTIVO, @SUFIJO,
          C.VALOR_BASE, E.SALARIO, @FECHA_INICIAL_LIQ, @FECHA_FINAL_LIQ, C.DIAS, C.DIAS_PERIODO,
          N'PRESTACION', N'Devengado', ISNULL(C.VALOR, 0), 0, 0, ISNULL(C.VALOR, 0), @USUARIO,
          0, 0, E.ID_EMPRESA, @ID_UN,
          C.DETALLE + ISNULL(N' - Causa: ' + @ID_CAUSA, N''),
          C.FECHA_DESDE, C.FECHA_HASTA
        FROM #CALC C
        INNER JOIN #EMP E ON E.ID_EMPLEADO = C.ID_EMPLEADO;

      COMMIT TRANSACTION;

      -- Continúa en el bloque común de recálculo de LCJ y respuesta.
    END;


    /*=========================================================================
      AJUSTES (valores modificados en la grilla del paso 3)
    =========================================================================*/
    IF @ACC = N'ajustes'
    BEGIN

      IF @CONSECUTIVO IS NULL OR @FECHA_RETIRO IS NULL
      BEGIN
        SELECT DATA = (SELECT ErrMensaje = N'No se identificó la liquidación a ajustar.' FOR JSON PATH);
        RETURN;
      END;

      CREATE TABLE #AJUSTES (
        ID_EMPLEADO NVARCHAR(50) COLLATE DATABASE_DEFAULT,
        ORIGEN      NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        ID_CONCEPTO NVARCHAR(20) COLLATE DATABASE_DEFAULT,
        VALOR       DECIMAL(18,2)
      );

      INSERT INTO #AJUSTES (ID_EMPLEADO, ORIGEN, ID_CONCEPTO, VALOR)
      SELECT J.ID_EMPLEADO, UPPER(J.ORIGEN), J.ID_CONCEPTO, ISNULL(J.VALOR, 0)
      FROM OPENJSON(@DATA_JSON, '$.AJUSTES') WITH (
        ID_EMPLEADO NVARCHAR(50)  '$.ID_EMPLEADO',
        ORIGEN      NVARCHAR(10)  '$.ORIGEN',
        ID_CONCEPTO NVARCHAR(20)  '$.ID_CONCEPTO',
        VALOR       DECIMAL(18,2) '$.VALOR'
      ) J
      WHERE J.ID_EMPLEADO IS NOT NULL AND J.ID_CONCEPTO IS NOT NULL AND UPPER(J.ID_CONCEPTO) <> N'LCJ';

      IF NOT EXISTS (SELECT 1 FROM #FILTRO_EMPLEADOS)
        INSERT INTO #FILTRO_EMPLEADOS (ID_EMPLEADO)
        SELECT DISTINCT ID_EMPLEADO FROM #AJUSTES;

      BEGIN TRANSACTION;

        -- Prestaciones: un registro por concepto
        UPDATE O SET
          VALOR = A.VALOR,
          NETO  = A.VALOR,
          HORA  = GETDATE(),
          USUARIO = @USUARIO
        FROM LIQUIDACION_OTROS O
        INNER JOIN #AJUSTES A ON A.ID_EMPLEADO = O.ID_EMPLEADO AND A.ID_CONCEPTO = O.ID_CONCEPTO
        WHERE A.ORIGEN = N'OTROS'
          AND O.ID_UN = @ID_UN
          AND O.ID_APLICACION = @APLICACION
          AND O.ID_DOCUMENTO = @ID_DOCUMENTO
          AND O.CONSECUTIVO = @CONSECUTIVO;

        -- Nómina: el concepto puede tener varios ítems; la diferencia se aplica al primero
        ;WITH ACTUAL AS (
          SELECT N.ID_EMPLEADO, N.ID_CONCEPTO, TOTAL = SUM(ISNULL(N.VALOR, 0)), ITEM = MIN(N.ITEM)
          FROM LIQUIDACION_NOMINA N
          INNER JOIN #AJUSTES A ON A.ID_EMPLEADO = N.ID_EMPLEADO AND A.ID_CONCEPTO = N.ID_CONCEPTO AND A.ORIGEN = N'NOMINA'
          WHERE N.ID_UN = @ID_UN
            AND N.ID_LIQUIDACION = @ID_LIQUIDACION
            AND N.ID_DOCUMENTO = @ID_DOCUMENTO
            AND N.CONSECUTIVO = @CONSECUTIVO
          GROUP BY N.ID_EMPLEADO, N.ID_CONCEPTO
        )
        UPDATE N SET
          VALOR = ISNULL(N.VALOR, 0) + (A.VALOR - X.TOTAL),
          NETO  = ISNULL(N.NETO, 0)  + (A.VALOR - X.TOTAL)
        FROM LIQUIDACION_NOMINA N
        INNER JOIN ACTUAL X ON X.ID_EMPLEADO = N.ID_EMPLEADO AND X.ID_CONCEPTO = N.ID_CONCEPTO AND X.ITEM = N.ITEM
        INNER JOIN #AJUSTES A ON A.ID_EMPLEADO = N.ID_EMPLEADO AND A.ID_CONCEPTO = N.ID_CONCEPTO AND A.ORIGEN = N'NOMINA'
        WHERE N.ID_UN = @ID_UN
          AND N.ID_LIQUIDACION = @ID_LIQUIDACION
          AND N.ID_DOCUMENTO = @ID_DOCUMENTO
          AND N.CONSECUTIVO = @CONSECUTIVO;

      COMMIT TRANSACTION;

      -- LCJ sólo se recalcula si ya existía para el empleado (finalización de contrato)
      SET @ES_CONTRATO = 1;
    END;


    /*=========================================================================
      BLOQUE COMÚN (prestaciones / ajustes): LCJ y respuesta consolidada
    =========================================================================*/
    IF @ACC IN (N'prestaciones', N'ajustes')
    BEGIN

      -- Detalle unificado de la liquidación (nómina del mes + prestaciones)
      CREATE TABLE #DET (
        ID_EMPLEADO NVARCHAR(50)  COLLATE DATABASE_DEFAULT,
        ORIGEN      NVARCHAR(10)  COLLATE DATABASE_DEFAULT,
        ID_CONCEPTO NVARCHAR(20)  COLLATE DATABASE_DEFAULT,
        DESCRIPCION NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        TIPO_VALOR  NVARCHAR(20)  COLLATE DATABASE_DEFAULT,
        DIAS        DECIMAL(9,2),
        VALOR_BASE  DECIMAL(18,2),
        VALOR       DECIMAL(18,2)
      );

      INSERT INTO #DET (ID_EMPLEADO, ORIGEN, ID_CONCEPTO, DESCRIPCION, TIPO_VALOR, DIAS, VALOR_BASE, VALOR)
      SELECT N.ID_EMPLEADO, N'NOMINA', N.ID_CONCEPTO,
             ISNULL(NULLIF(MAX(N.DETALLE), N''), N.ID_CONCEPTO),
             CASE WHEN UPPER(MAX(N.TIPO_VALOR)) = N'DEDUCIDO' THEN N'Deducido' ELSE N'Devengado' END,
             MAX(N.DIAS), MAX(N.VALOR_BASE), SUM(ISNULL(N.VALOR, 0))
      FROM LIQUIDACION_NOMINA N
      INNER JOIN #FILTRO_EMPLEADOS F ON F.ID_EMPLEADO = N.ID_EMPLEADO
      WHERE N.ID_UN = @ID_UN
        AND N.ID_LIQUIDACION = @ID_LIQUIDACION
        AND N.ID_DOCUMENTO = @ID_DOCUMENTO
        AND N.CONSECUTIVO = @CONSECUTIVO
        AND UPPER(N.TIPO_VALOR) IN (N'DEVENGADO', N'DEDUCIDO')
      GROUP BY N.ID_EMPLEADO, N.ID_CONCEPTO;

      INSERT INTO #DET (ID_EMPLEADO, ORIGEN, ID_CONCEPTO, DESCRIPCION, TIPO_VALOR, DIAS, VALOR_BASE, VALOR)
      SELECT O.ID_EMPLEADO, N'OTROS', O.ID_CONCEPTO,
             ISNULL(NULLIF(MAX(O.DETALLE), N''), O.ID_CONCEPTO),
             CASE WHEN UPPER(MAX(O.TIPO_VALOR)) = N'DEDUCIDO' THEN N'Deducido' ELSE N'Devengado' END,
             MAX(O.DIAS), MAX(O.VALOR_BASE), SUM(ISNULL(O.VALOR, 0))
      FROM LIQUIDACION_OTROS O
      INNER JOIN #FILTRO_EMPLEADOS F ON F.ID_EMPLEADO = O.ID_EMPLEADO
      WHERE O.ID_UN = @ID_UN
        AND O.ID_APLICACION = @APLICACION
        AND O.ID_DOCUMENTO = @ID_DOCUMENTO
        AND O.CONSECUTIVO = @CONSECUTIVO
        AND O.ID_CONCEPTO <> N'LCJ'
        AND UPPER(O.TIPO_VALOR) IN (N'DEVENGADO', N'DEDUCIDO')
      GROUP BY O.ID_EMPLEADO, O.ID_CONCEPTO;

      -- LCJ: neto a pagar por finalización de contrato
      IF @ES_CONTRATO = 1
      BEGIN
        BEGIN TRANSACTION;

          IF @ACC = N'prestaciones'
            INSERT INTO LIQUIDACION_OTROS (
              ID_UN, ID_LIQUIDACION, ID_EMPLEADO, ID_APLICACION, ID_PERIODO, ID_CONCEPTO,
              FECHA, HORA, ITEM, ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO,
              VALOR_BASE, FECHA_INICIAL, FECHA_FINAL, DIAS, DIAS_PERIODO,
              TIPO, TIPO_VALOR, VALOR, VALOR_EMPRESA, VALOR_NOVEDAD, NETO, USUARIO,
              BASE_SALARIAL, BASE_APORTES, ID_EMPRESA, ID_UN_ITEM, DETALLE,
              FECHA_DESDE, FECHA_HASTA)
            SELECT
              @ID_UN, @ID_LIQUIDACION, E.ID_EMPLEADO, @APLICACION, @ID_PERIODO, N'LCJ',
              @FECHA_RETIRO, GETDATE(), 99, @ID_DOCUMENTO, @PREFIJO, @CONSECUTIVO, @SUFIJO,
              0, @FECHA_INICIAL_LIQ, @FECHA_FINAL_LIQ, 0, 0,
              N'LIQUIDACION', N'Neto', 0, 0, 0, 0, @USUARIO,
              0, 0, E.ID_EMPRESA, @ID_UN,
              N'Liquidación de contrato' + ISNULL(N' - Causa: ' + @ID_CAUSA, N''),
              E.FECHA_INICIAL, @FECHA_RETIRO
            FROM #EMP E;

          UPDATE O SET
            VALOR = ISNULL(T.NETO, 0),
            NETO  = ISNULL(T.NETO, 0),
            HORA  = GETDATE()
          FROM LIQUIDACION_OTROS O
          OUTER APPLY (
            SELECT NETO = SUM(CASE WHEN D.TIPO_VALOR = N'Deducido' THEN -D.VALOR ELSE D.VALOR END)
            FROM #DET D
            WHERE D.ID_EMPLEADO = O.ID_EMPLEADO
          ) T
          WHERE O.ID_UN = @ID_UN
            AND O.ID_APLICACION = @APLICACION
            AND O.ID_DOCUMENTO = @ID_DOCUMENTO
            AND O.CONSECUTIVO = @CONSECUTIVO
            AND O.ID_CONCEPTO = N'LCJ'
            AND O.ID_EMPLEADO IN (SELECT ID_EMPLEADO FROM #FILTRO_EMPLEADOS);

        COMMIT TRANSACTION;
      END;

      -- Respuesta: [{ CONSECUTIVO, ID_LIQUIDACION, FECHA_RETIRO, CONCEPTOS:[...], EMPLEADOS:[{..., DETALLE:[...]}] }]
      SELECT DATA = N'[' + (
        SELECT
          CONSECUTIVO    = @CONSECUTIVO,
          ID_LIQUIDACION = @ID_LIQUIDACION,
          ID_DOCUMENTO   = @ID_DOCUMENTO,
          FECHA_RETIRO   = CONVERT(CHAR(10), @FECHA_RETIRO, 23),
          CONCEPTOS = JSON_QUERY(ISNULL((
            SELECT D.ORIGEN, D.ID_CONCEPTO, DESCRIPCION = MAX(D.DESCRIPCION), D.TIPO_VALOR
            FROM #DET D
            GROUP BY D.ORIGEN, D.ID_CONCEPTO, D.TIPO_VALOR
            ORDER BY D.TIPO_VALOR DESC, D.ORIGEN, D.ID_CONCEPTO
            FOR JSON PATH), N'[]')),
          EMPLEADOS = JSON_QUERY(ISNULL((
            SELECT
              C.ID_EMPLEADO,
              C.NOMBRE,
              FECHA_INICIAL     = CONVERT(CHAR(10), C.FECHA_INICIAL, 23),
              FECHA_FINAL       = CONVERT(CHAR(10), @FECHA_RETIRO, 23),
              SALARIO_BASICO    = C.SALARIO,
              BASE_PRESTACIONAL = ISNULL((
                SELECT MAX(D.VALOR_BASE) FROM #DET D
                WHERE D.ID_EMPLEADO = C.ID_EMPLEADO AND D.ORIGEN = N'OTROS'
                  AND D.ID_CONCEPTO IN (N'LPS', N'LCS', N'LIN')),
                C.SALARIO + CASE WHEN C.SALARIO <= 2 * @SMMLV THEN @AUX_TRANSPORTE ELSE 0 END),
              DETALLE = JSON_QUERY(ISNULL((
                SELECT D.ORIGEN, D.ID_CONCEPTO, D.DESCRIPCION, D.TIPO_VALOR, D.DIAS, D.VALOR_BASE, D.VALOR
                FROM #DET D
                WHERE D.ID_EMPLEADO = C.ID_EMPLEADO
                ORDER BY D.TIPO_VALOR DESC, D.ORIGEN, D.ID_CONCEPTO
                FOR JSON PATH), N'[]'))
            FROM #CONTRATOS C
            INNER JOIN #FILTRO_EMPLEADOS F ON F.ID_EMPLEADO = C.ID_EMPLEADO
            WHERE EXISTS (SELECT 1 FROM #DET D WHERE D.ID_EMPLEADO = C.ID_EMPLEADO)
            ORDER BY C.NOMBRE
            FOR JSON PATH, INCLUDE_NULL_VALUES), N'[]'))
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
      ) + N']';
      RETURN;
    END;


    SELECT DATA = (SELECT ErrMensaje = N'Acción no soportada: ' + ISNULL(@ACCION, N'') FOR JSON PATH);

  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

    SET @ERR = N'spLiqPrestaciones (' + ISNULL(@ACCION, N'') + N'): ' + ERROR_MESSAGE();
    SELECT DATA = (SELECT ErrMensaje = @ERR FOR JSON PATH);
  END CATCH;
END;
GO
