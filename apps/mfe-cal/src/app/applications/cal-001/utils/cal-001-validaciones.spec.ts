import { HoyPrueba, PartesPrueba, borradorCliente, borradorProduccion, registroGuardado } from '../testing/cal-001.fixtures';
import { esFechaValida, hoyColombia, mostrarFecha, sumarDias } from './cal-001-fecha';
import { borradorDesdeRegistro, borradorVacio, operarioDesdeMaestro, partesDesdeProducto, tieneCaptura } from './cal-001-modelo';
import { cabeEnCp1252, partesConCausas, validarBorrador, validarEvidencia } from './cal-001-validaciones';

describe('CAL-001 modelo del borrador', () => {
  it('un registro nuevo arranca en Producción con la fecha del evento de hoy y sin partes', () => {
    const borrador = borradorVacio(HoyPrueba);
    expect(borrador.ORIGEN).toBe('PRODUCCION');
    expect(borrador.FECHA_EVENTO).toBe(HoyPrueba);
    expect(borrador.PARTES).toEqual([]);
    expect(tieneCaptura(borrador)).toBe(false);
  });

  it('la grilla muestra las partes PA del PF con Pieza vacía (historia 2)', () => {
    const partes = partesDesdeProducto(PartesPrueba);
    expect(partes.map(p => p.ID_PARTE)).toEqual(['PA-501', 'PA-504']);
    expect(partes.every(p => p.PIEZA === '' && p.CAUSAS.length === 0)).toBe(true);
  });

  it('un PF sin partes ofrece una sola fila "Producto completo" (DP-4)', () => {
    const partes = partesDesdeProducto({ PRODUCTO: 'PF-9', SIN_PARTES: 1, PARTES: [] });
    expect(partes).toHaveLength(1);
    expect(partes[0].ID_PARTE).toBeNull();
    expect(partes[0].NOMBRE_PARTE).toBe('Producto completo');
  });

  it('el proceso del operario se llena con su sección principal (historia 4)', () => {
    const operario = operarioDesdeMaestro({ ID_EMPLEADO: '7', NOMBRE: 'Ana', ID_SECCION_SUGERIDA: 'S2',
      SECCIONES: [{ ID_SECCION: 'S2', DESCRIPCION: 'Pintura', PRINCIPAL: 1 }, { ID_SECCION: 'S3', DESCRIPCION: 'Lijado', PRINCIPAL: 0 }] });
    expect(operario.ID_SECCION).toBe('S2');
    expect(operario.DESCRIPCION_SECCION).toBe('Pintura');
    expect(operario.OCURRENCIAS).toBe(1);
  });

  it('sin una única principal el proceso queda por elegir', () => {
    const operario = operarioDesdeMaestro({ ID_EMPLEADO: '8', NOMBRE: 'Luis', ID_SECCION_SUGERIDA: null,
      SECCIONES: [{ ID_SECCION: 'S2', DESCRIPCION: 'Pintura', PRINCIPAL: 0 }, { ID_SECCION: 'S3', DESCRIPCION: 'Lijado', PRINCIPAL: 0 }] });
    expect(operario.ID_SECCION).toBeNull();
  });

  it('al abrir un registro guardado conserva los IDs y muestra todas las partes del PF', () => {
    const borrador = borradorDesdeRegistro(registroGuardado(), PartesPrueba);
    expect(borrador.ID_REGISTRO_NC).toBe(7);
    expect(borrador.VERSION).toBe(1);
    expect(borrador.PARTES.map(p => p.ID_PARTE)).toEqual(['PA-501', 'PA-504']);
    expect(borrador.PARTES[0].ID_PARTE_NC).toBe(10);
    expect(borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].ID_OPERARIO_NC).toBe(30);
    expect(partesConCausas(borrador)).toHaveLength(1);
  });
});

describe('CAL-001 validaciones (reglas del contrato §2.3)', () => {
  it('un registro de Producción completo es válido', () => {
    expect(validarBorrador(borradorProduccion(), HoyPrueba, 'new')).toEqual([]);
  });

  it('fase 2: la fecha del evento es opcional (vacía → hoy en el SP), pero no puede ser posterior a hoy', () => {
    const sinFecha = { ...borradorProduccion(), FECHA_EVENTO: '' };
    expect(validarBorrador(sinFecha, HoyPrueba, 'new')).toEqual([]);
    expect(validarBorrador({ ...borradorProduccion(), FECHA_EVENTO: '2026-02-30' }, HoyPrueba, 'new')).toContain('La fecha del evento no es válida.');
    const futura = { ...borradorProduccion(), FECHA_EVENTO: '2026-10-27' };
    expect(validarBorrador(futura, HoyPrueba, 'new')).toContain('La fecha del evento no puede ser posterior a hoy.');
    expect(validarBorrador({ ...borradorProduccion(), FECHA_EVENTO: HoyPrueba }, HoyPrueba, 'new')).toEqual([]);
  });

  it('agregar: las ocurrencias adicionales son enteras y el total no pasa de 999', () => {
    const borrador = borradorProduccion();
    const operario = borrador.PARTES[0].CAUSAS[0].OPERARIOS[0];
    operario.ADICIONALES = 3;
    expect(validarBorrador(borrador, HoyPrueba, 'agregar')).toEqual([]);
    operario.ADICIONALES = 1.5;
    expect(validarBorrador(borrador, HoyPrueba, 'agregar').join(' ')).toContain('ocurrencias adicionales deben ser un entero');
    operario.ADICIONALES = 998;
    expect(validarBorrador(borrador, HoyPrueba, 'agregar').join(' ')).toContain('supera 999');
  });

  it('en Producción cada no conformidad necesita al menos un operario (historia 5)', () => {
    const borrador = borradorProduccion();
    borrador.PARTES[0].CAUSAS[1].OPERARIOS = [];
    expect(validarBorrador(borrador, HoyPrueba, 'new').join(' ')).toContain('en Producción cada no conformidad necesita al menos un operario');
  });

  it('en Cliente los operarios son opcionales y se exigen los datos de la garantía (historia 6)', () => {
    expect(validarBorrador(borradorCliente(), HoyPrueba, 'new')).toEqual([]);
    const incompleto = { ...borradorCliente(), N_SERVICIO: '', FUENTE: '' };
    expect(validarBorrador(incompleto, HoyPrueba, 'new')).toContain('Datos de la garantía obligatorios: Número de servicio, Fuente.');
  });

  it('exige al menos una no conformidad', () => {
    const borrador = borradorProduccion();
    borrador.PARTES.forEach(p => { p.CAUSAS = []; });
    expect(validarBorrador(borrador, HoyPrueba, 'new')).toContain('Agregue al menos una no conformidad en una parte del producto.');
  });

  it('las ocurrencias son enteros de 1 a 999', () => {
    for (const valor of [0, 1000, 1.5, null]) {
      const borrador = borradorProduccion();
      borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].OCURRENCIAS = valor;
      expect(validarBorrador(borrador, HoyPrueba, 'new').join(' ')).toContain('las ocurrencias deben ser un entero de 1 a 999');
    }
    const borrador = borradorProduccion();
    borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].OCURRENCIAS = 999;
    expect(validarBorrador(borrador, HoyPrueba, 'new')).toEqual([]);
  });

  it('la Pieza no acepta más de 50 caracteres y es obligatoria en "Producto completo"', () => {
    const larga = borradorProduccion();
    larga.PARTES[0].PIEZA = 'ñ'.repeat(51);
    expect(validarBorrador(larga, HoyPrueba, 'new').join(' ')).toContain('la pieza supera 50 caracteres');
    const exacta = borradorProduccion();
    exacta.PARTES[0].PIEZA = 'á'.repeat(50);
    expect(validarBorrador(exacta, HoyPrueba, 'new')).toEqual([]);

    const completo = borradorProduccion();
    completo.PARTES = partesDesdeProducto({ PRODUCTO: 'PF-9', SIN_PARTES: 1, PARTES: [] });
    completo.PARTES[0].CAUSAS = borradorProduccion().PARTES[0].CAUSAS;
    expect(validarBorrador(completo, HoyPrueba, 'new')).toContain('Producto completo: escriba la pieza afectada.');
    completo.PARTES[0].PIEZA = 'Cajón';
    expect(validarBorrador(completo, HoyPrueba, 'new')).toEqual([]);
  });

  it('B2: avisa si una parte tiene Pieza escrita pero ninguna no conformidad', () => {
    const borrador = borradorProduccion();
    borrador.PARTES[1].PIEZA = 'Frente con golpe';
    expect(validarBorrador(borrador, HoyPrueba, 'new'))
      .toContain('PA-504 · Frente cajón superior: tiene Pieza escrita pero ninguna no conformidad; agregue una o borre la pieza.');
  });

  it('no permite causas ni operarios repetidos', () => {
    const borrador = borradorProduccion();
    borrador.PARTES[0].CAUSAS[1].ID_CAUSA = 'NC-01';
    borrador.PARTES[0].CAUSAS[0].OPERARIOS.push({ ...borrador.PARTES[0].CAUSAS[0].OPERARIOS[0] });
    const errores = validarBorrador(borrador, HoyPrueba, 'new').join(' ');
    expect(errores).toContain('la no conformidad NC-01 está repetida');
    expect(errores).toContain('el operario Óscar Villa está repetido');
  });

  it('el operario necesita proceso y la cantidad de referencia admite 2 decimales', () => {
    const borrador = borradorProduccion();
    borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].ID_SECCION = null;
    borrador.CANTIDAD_REFERENCIA = 1.234;
    const errores = validarBorrador(borrador, HoyPrueba, 'new').join(' ');
    expect(errores).toContain('elija el proceso');
    expect(errores).toContain('máximo 2 decimales');
    expect(validarBorrador({ ...borradorProduccion(), CANTIDAD_REFERENCIA: 1.1 }, HoyPrueba, 'new')).toEqual([]);
  });

  it('el número de servicio rechaza caracteres fuera de cp1252 (E21)', () => {
    expect(cabeEnCp1252('SV-3307 ñ € “')).toBe(true);
    expect(cabeEnCp1252('SV-✓')).toBe(false);
    expect(validarBorrador({ ...borradorCliente(), N_SERVICIO: 'SV-✓' }, HoyPrueba, 'new'))
      .toContain('El número de servicio tiene caracteres no permitidos.');
  });
});

describe('CAL-001 fechas en hora de Colombia', () => {
  it('hoy se calcula en America/Bogota aunque en UTC ya sea mañana', () => {
    expect(hoyColombia(new Date('2026-10-27T03:30:00Z'))).toBe('2026-10-26');
    expect(hoyColombia(new Date('2026-10-27T05:30:00Z'))).toBe('2026-10-27');
  });

  it('valida, suma y muestra fechas', () => {
    expect(esFechaValida('2026-02-30')).toBe(false);
    expect(esFechaValida('2026-10-26')).toBe(true);
    expect(sumarDias('2026-10-26', -30)).toBe('2026-09-26');
    expect(mostrarFecha('2026-10-20T09:15:00')).toBe('20/10/2026 09:15');
  });
});

describe('CAL-001 foto de evidencia obligatoria', () => {
  it('un registro nuevo exige al menos una foto elegida', () => {
    expect(validarEvidencia('new', 0, 0)).toEqual(['Agregue al menos una foto de evidencia.']);
    expect(validarEvidencia('new', 0, 1)).toEqual([]);
  });

  it('Modificar o Agregar un registro sin fotos activas exige una', () => {
    const mensaje = ['El registro no tiene fotos: agregue al menos una foto de evidencia.'];
    expect(validarEvidencia('update', 0, 0)).toEqual(mensaje);
    expect(validarEvidencia('agregar', 0, 0)).toEqual(mensaje);
    expect(validarEvidencia('update', 0, 2)).toEqual([]);
  });

  it('con fotos activas no se exige otra', () => {
    expect(validarEvidencia('update', 1, 0)).toEqual([]);
    expect(validarEvidencia('agregar', 3, 0)).toEqual([]);
  });
});
