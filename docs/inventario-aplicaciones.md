# Inventario de aplicaciones y objetos

Fecha: 2026-09-25. Extra?do est?ticamente del c?digo TypeScript. Las declaraciones no prueban que una funcionalidad est? completa ni validan el esquema de base de datos. Se omiten pruebas y miembros privados de clases. Los campos listados son miembros directos; los heredados se consultan en el c?digo fuente.

## mfe-adm

### [adm-015/adm-015.component.ts](../apps/mfe-adm/src/app/applications/adm-015/adm-015.component.ts)

- class `Adm015Component` ? `applicationId`, `applicationTitle`, `tableBase`, `estados`, `expirarOptions`, `intervalos`, `viewColumns`, `loading`, `permissions`, `mode`, `records`, `currentIndex`, `activeTab`, `filterVisible`, `viewVisible`, `reportsVisible`, `passwordModalVisible`, `autorizaciones`, `permisosEspeciales`, `unAsociadas`, `conexiones`, `settings`, `roles`, `availableApps`, `availableUNs`, `availableConexiones`, `readOnly`, `isEditing`, `isNew`, `currentRecord`, `queryFilter`, `form`, `passwordForm`, `ngOnInit()`, `ngOnDestroy()`, `navigate()`, `onFilterApplied()`, `onRecordSelectedFromView()`, `copyPermissionsFromRole()`, `openPasswordModal()`, `closePasswordModal()`, `submitChangePassword()`

### [adm-015/components/xtein-adm015-aplicaciones/xtein-adm015-aplicaciones.component.ts](../apps/mfe-adm/src/app/applications/adm-015/components/xtein-adm015-aplicaciones/xtein-adm015-aplicaciones.component.ts)

- class `XteinAdm015AplicacionesComponent` ? `autorizaciones`, `readOnly`, `availableApps`, `autorizacionesChange`, `copyFromRole`, `onCellChanged()`, `markAllColumn()`, `assignAllApps()`, `removeSelected()`

### [adm-015/components/xtein-adm015-conexiones/xtein-adm015-conexiones.component.ts](../apps/mfe-adm/src/app/applications/adm-015/components/xtein-adm015-conexiones/xtein-adm015-conexiones.component.ts)

- class `XteinAdm015ConexionesComponent` ? `conexiones`, `readOnly`, `availableConexiones`, `conexionesChange`, `setDefaultConexion()`, `onAddConexion()`, `onRemoveConexion()`

### [adm-015/components/xtein-adm015-configuraciones/xtein-adm015-configuraciones.component.ts](../apps/mfe-adm/src/app/applications/adm-015/components/xtein-adm015-configuraciones/xtein-adm015-configuraciones.component.ts)

- class `XteinAdm015ConfiguracionesComponent` ? `settings`, `readOnly`, `settingsChange`, `onCellChanged()`

### [adm-015/components/xtein-adm015-permisos-especiales/xtein-adm015-permisos-especiales.component.ts](../apps/mfe-adm/src/app/applications/adm-015/components/xtein-adm015-permisos-especiales/xtein-adm015-permisos-especiales.component.ts)

- class `XteinAdm015PermisosEspecialesComponent` ? `permisosEspeciales`, `readOnly`, `permisosEspecialesChange`, `onCellChanged()`

### [adm-015/components/xtein-adm015-un-asociadas/xtein-adm015-un-asociadas.component.ts](../apps/mfe-adm/src/app/applications/adm-015/components/xtein-adm015-un-asociadas/xtein-adm015-un-asociadas.component.ts)

- class `XteinAdm015UnAsociadasComponent` ? `unAsociadas`, `readOnly`, `availableUNs`, `unAsociadasChange`, `setDefaultUN()`, `onAddUN()`, `onRemoveUN()`

### [adm-015/constants/adm-015-catalog.constants.ts](../apps/mfe-adm/src/app/applications/adm-015/constants/adm-015-catalog.constants.ts)

- const `Adm015Catalog`

### [adm-015/constants/adm-015-logging.constants.ts](../apps/mfe-adm/src/app/applications/adm-015/constants/adm-015-logging.constants.ts)

- const `createAdm015Log`

### [adm-015/constants/adm-015-ui.constants.ts](../apps/mfe-adm/src/app/applications/adm-015/constants/adm-015-ui.constants.ts)

- const `Adm015Estados`
- const `Adm015ExpirarOptions`
- const `Adm015Intervalos`
- const `Adm015RecordViewColumns`
- const `Adm015DefaultRecord`

### [adm-015/constants/adm-015.constants.ts](../apps/mfe-adm/src/app/applications/adm-015/constants/adm-015.constants.ts)

- const `Adm015Application`
- type `Adm015Application`
- const `Adm015Endpoint`
- type `Adm015Endpoint`
- const `Adm015ToolbarCapabilities`

### [adm-015/models/adm-015-business.model.ts](../apps/mfe-adm/src/app/applications/adm-015/models/adm-015-business.model.ts)

- interface `Adm015SavePayload` ? `USUARIOS`, `AUTORIZACIONES`, `PERMISOS_ESPECIALES`, `UN_ASOCIADAS`, `CONEXIONES`, `SETTINGS`
- interface `Adm015ChangePasswordPayload` ? `USUARIO`, `PASSWORD`, `TIPO`

### [adm-015/models/adm-015.model.ts](../apps/mfe-adm/src/app/applications/adm-015/models/adm-015.model.ts)

- interface `Adm015UsuarioRecord` ? `USUARIO`, `NOMBRE`, `ID_ROL`, `FECHA_CREACION?`, `CLAVE_PRIMARIA?`, `CLAVE_SECUNDARIA?`, `CLAVE_TERCIARIA?`, `EXPIRAR`, `EXPIRARstr?`, `TIEMPO_INTERVALO`, `INTERVALO`, `CAMBIAR_CLAVE`, `ESTADO`, `FECHA_CONFIGURACION?`, `IMAGEN?`, `EMAIL`, `TIEMPO_SESION?`, `QFILTRO?`
- interface `Adm015AutorizacionRecord` ? `ITEM?`, `ID_UN?`, `USUARIO?`, `ID_APLICACION`, `NOMBRE?`, `CREAR`, `MODIFICAR`, `ELIMINAR`, `BUSCAR`, `LISTAR`, `EXCLUSIVA?`, `CONFIGURAR?`, `S_NIVEL?`, `S_CLAVE?`, `S_ABRIR?`, `S_CREAR?`, `S_MODIFICAR?`, `S_ELIMINAR?`, `S_BUSCAR?`, `S_LISTAR?`, `S_APROBAR?`, `A_NIVEL?`, `A_CLAVE?`, `A_ABRIR?`, `A_CREAR?`, `A_MODIFICAR?`, `A_ELIMINAR?`, `A_BUSCAR?`, `A_LISTAR?`, `A_APROBAR?`, `isEdit?`
- interface `Adm015PermisoEspecialRecord` ? `ITEM?`, `ID_UN?`, `USUARIO?`, `TRANSACCION`, `NOMBRE?`, `PERMISO`, `APROBACION`, `isEdit?`
- interface `Adm015UNAsociadaRecord` ? `ITEM?`, `ID_UN?`, `ID_UN_ASOCIADA`, `USUARIO?`, `NOMBRE?`, `VALOR_DEFECTO`, `isEdit?`
- interface `Adm015ConexionRecord` ? `ITEM?`, `USUARIO?`, `ID_CONEXION`, `NOMBRE?`, `ULTIMA?`, `ULTIMA_UN?`, `isEdit?`
- interface `Adm015SettingAplicacionRecord` ? `ITEM?`, `ID_APLICACION`, `NOMBRE_APLICACION?`, `DESCRIPCION`, `ASIGNAR`, `isEdit?`
- interface `Adm015Lookup` ? `code`, `description`

### [adm-015/services/adm-015-business.service.ts](../apps/mfe-adm/src/app/applications/adm-015/services/adm-015-business.service.ts)

- class `Adm015BusinessService` ? `identity`, `decode()`, `catalog()`, `queryUsers()`, `loadAutorizaciones()`, `loadPermisosEspeciales()`, `loadUNAsociadas()`, `loadConexiones()`, `loadSettings()`, `saveUser()`, `deleteUser()`, `changePassword()`, `checkUserExists()`

### [adm-015/services/adm-015.service.ts](../apps/mfe-adm/src/app/applications/adm-015/services/adm-015.service.ts)

- class `Adm015Service` ? `getApplicationId()`, `request()`, `query()`, `save()`, `delete()`, `changePassword()`, `checkUserExists()`

### [adm-300/adm-300.component.ts](../apps/mfe-adm/src/app/applications/adm-300/adm-300.component.ts)

- class `Adm300Component` ? `loading`, `errors`, `frequent`, `favorites`, `available`, `visibleListaFav`, `selectedFavorites`, `valueContent`, `cardOrder`, `draggedCard`, `isMultiline`, `currentTab`, `populationByRegions`, `populationData`, `assignees`, `priorities`, `appointmentsData`, `currentDate`, `myCustomPalette1`, `myCustomPalette2`, `DCompras`, `customizeLabel`, `favoriteColumns`, `controlOptions`, `ngOnInit()`, `refresh()`, `open()`, `editFavorites()`, `applyFavorites()`, `startCard()`, `dropCard()`, `ngOnDestroy()`

### [adm-300/constants/adm-300-logging.constants.ts](../apps/mfe-adm/src/app/applications/adm-300/constants/adm-300-logging.constants.ts)

- const `createAdm300Log`

### [adm-300/constants/tablero-controls.constants.ts](../apps/mfe-adm/src/app/applications/adm-300/constants/tablero-controls.constants.ts)

- function `createTableroControlOptions`

### [adm-300/constants/tablero-demo.constants.ts](../apps/mfe-adm/src/app/applications/adm-300/constants/tablero-demo.constants.ts)

- const `assignees`
- const `priorities`
- const `populationByRegions`
- const `populationData`
- const `appointmentsData`

### [adm-300/models/tablero-controls.model.ts](../apps/mfe-adm/src/app/applications/adm-300/models/tablero-controls.model.ts)

- interface `TableroControlsContext` ? `populationData`, `assignees`, `priorities`, `currentDate`, `customizeLabel`

### [adm-300/models/tablero-purchase.model.ts](../apps/mfe-adm/src/app/applications/adm-300/models/tablero-purchase.model.ts)

- interface `TableroPurchase` ? `PRODUCTO`, `NOMBRE`, `ID_UDM`, `MARCA_MIN`, `CANT_BODEGA`, `PUNTO_MINIMO`, `PUNTO_MAXIMO`, `PORCENTAJE`, `color_ind`, `NOMBRE_PROVEEDOR`, `CANT_COMPRAR`

### [adm-300/services/tablero-data.service.ts](../apps/mfe-adm/src/app/applications/adm-300/services/tablero-data.service.ts)

- interface `TableroApplication` ? `ID_APLICACION`, `NOMBRE`, `icon?`
- class `TableroDataService` ? `loadApplications()`

### [adm-application.registry.ts](../apps/mfe-adm/src/app/applications/adm-application.registry.ts)

- const `AdmApplicationRegistry`
- function `findAdmApplication`

## mfe-dashboard

### [dashboard/constants/dashboard-toolbar.constants.ts](../apps/mfe-dashboard/src/app/applications/dashboard/constants/dashboard-toolbar.constants.ts)

- const `DASHBOARD_TOOLBAR_CAPABILITIES`

### [dashboard/dashboard-application.component.ts](../apps/mfe-dashboard/src/app/applications/dashboard/dashboard-application.component.ts)

- class `XteinDashboardApplicationComponent` ? `applicationId`, `ngOnChanges()`, `ngOnDestroy()`

## mfe-inv

### [inv-application.registry.ts](../apps/mfe-inv/src/app/applications/inv-application.registry.ts)

- const `InvApplicationRegistry`
- function `findInvApplication`

## mfe-mad

### [mad-001/constants/mad-001-logging.constants.ts](../apps/mfe-mad/src/app/applications/mad-001/constants/mad-001-logging.constants.ts)

- const `createMad001Log`

### [mad-001/constants/mad-001-ui.constants.ts](../apps/mfe-mad/src/app/applications/mad-001/constants/mad-001-ui.constants.ts)

- const `Mad001RecordViewColumns`
- const `Mad001DefaultRecord`
- const `Mad001ToolbarCapabilities`
- const `Mad001TreeSearchFields`

### [mad-001/constants/mad-001.constants.ts](../apps/mfe-mad/src/app/applications/mad-001/constants/mad-001.constants.ts)

- const `Mad001Application`
- const `Mad001Endpoint`
- const `Mad001Action`
- const `Mad001ParentApplicationType`

### [mad-001/mad-001.component.ts](../apps/mfe-mad/src/app/applications/mad-001/mad-001.component.ts)

- class `Mad001Component` ? `filterVisible`, `viewVisible`, `reportsVisible`, `settingsVisible`, `queryFilter`, `viewColumns`, `currentReportFilter()`, `selectViewedRecord()`, `searchRecords()`, `applicationId`, `treeSearchFields`, `form`, `mode`, `loading`, `treePanelCollapsed`, `applications`, `currentIndex`, `parentApplications`, `unitOfMeasures`, `typeOptions`, `actionOptions`, `statusOptions`, `levelOptions`, `validationRequested`, `ngOnInit()`, `ngOnDestroy()`, `showTree()`, `selectTreeItem()`, `toggleTreePanel()`, `isInvalid()`, `validateApplicationIdOnBlur()`

### [mad-001/models/mad-001.model.ts](../apps/mfe-mad/src/app/applications/mad-001/models/mad-001.model.ts)

- interface `Mad001ApplicationRecord` ? `ID_APLICACION`, `ID_APLICACION_PADRE`, `NOMBRE`, `TIPO`, `COMENTARIOS`, `ESTADO`, `ACCION`, `META_INFERIOR`, `META_SUPERIOR`, `UDM`, `NIVEL`, `ErrMensaje?`, `QFILTRO?`
- interface `Mad001ParentApplication` ? `ID_APLICACION`, `APLICACION`
- interface `Mad001UnitOfMeasure` ? `ID_UDM`, `NOMBRE`
- interface `Mad001DataLists` ? `udm`, `tipo`, `estado`, `tipoSistema`, `accion`, `nivel`, `ErrMensaje`

### [mad-001/services/mad-001.service.ts](../apps/mfe-mad/src/app/applications/mad-001/services/mad-001.service.ts)

- class `Mad001Service` ? `query()`, `getDataLists()`, `getParentApplications()`, `getApplicationTree()`, `validateKey()`, `create()`, `update()`, `delete()`

### [mad-002/constants/mad-002-logging.constants.ts](../apps/mfe-mad/src/app/applications/mad-002/constants/mad-002-logging.constants.ts)

- const `createMad002Log`

### [mad-002/constants/mad-002-ui.constants.ts](../apps/mfe-mad/src/app/applications/mad-002/constants/mad-002-ui.constants.ts)

- const `Mad002ToolbarCapabilities`
- const `Mad002TreeSearchFields`

### [mad-002/constants/mad-002.constants.ts](../apps/mfe-mad/src/app/applications/mad-002/constants/mad-002.constants.ts)

- const `Mad002Application`
- const `Mad002Endpoint`
- const `Mad002Action`
- const `Mad002DesignableApplicationTypes`

### [mad-002/mad-002.component.ts](../apps/mfe-mad/src/app/applications/mad-002/mad-002.component.ts)

- class `Mad002Component` ? `applicationId`, `treeSearchFields`, `applications`, `selectedApplication`, `selectedDashboardId`, `treePanelCollapsed`, `loading`, `ngOnInit()`, `ngOnDestroy()`, `selectTreeItem()`, `toggleTreePanel()`

### [mad-002/models/mad-002.model.ts](../apps/mfe-mad/src/app/applications/mad-002/models/mad-002.model.ts)

- interface `Mad002ApplicationNode` ? `ID_APLICACION`, `ID_APLICACION_PADRE`, `NOMBRE`, `TIPO`, `ESTADO`, `TIPO_SISTEMA?`, `NIVEL?`, `UDM?`, `META_INFERIOR?`, `META_SUPERIOR?`, `COMENTARIOS?`, `ErrMensaje?`

### [mad-002/services/mad-002.service.ts](../apps/mfe-mad/src/app/applications/mad-002/services/mad-002.service.ts)

- class `Mad002Service` ? `getApplicationTree()`

### [mad-005/constants/mad-005-logging.constants.ts](../apps/mfe-mad/src/app/applications/mad-005/constants/mad-005-logging.constants.ts)

- const `createMad005Log`

### [mad-005/constants/mad-005-ui.constants.ts](../apps/mfe-mad/src/app/applications/mad-005/constants/mad-005-ui.constants.ts)

- const `Mad005RecordViewColumns`
- const `Mad005StatusOptions`
- const `Mad005DefaultOptions`
- const `Mad005DefaultRecord`
- const `Mad005ToolbarCapabilities`

### [mad-005/constants/mad-005.constants.ts](../apps/mfe-mad/src/app/applications/mad-005/constants/mad-005.constants.ts)

- const `Mad005Application`
- type `Mad005Application`
- const `Mad005Endpoint`
- type `Mad005Endpoint`
- const `Mad005Action`
- type `Mad005Action`

### [mad-005/mad-005.component.ts](../apps/mfe-mad/src/app/applications/mad-005/mad-005.component.ts)

- class `Mad005Component` ? `filterVisible`, `viewVisible`, `reportsVisible`, `settingsVisible`, `queryFilter`, `viewColumns`, `currentReportFilter()`, `selectViewedRecord()`, `searchRecords()`, `applicationId`, `statusOptions`, `defaultOptions`, `form`, `mode`, `loading`, `readOnly`, `dataSourceTypes`, `records`, `currentIndex`, `validationRequested`, `ngOnInit()`, `ngOnDestroy()`, `updateConnectionParameters()`, `handleConnectionTest()`, `validateNameOnBlur()`, `isNameInvalid()`, `isOriginInvalid()`

### [mad-005/models/mad-005.model.ts](../apps/mfe-mad/src/app/applications/mad-005/models/mad-005.model.ts)

- interface `Mad005DataSourceConfiguration` ? `ID_ORIGEN_DATO`, `NOMBRE`, `ORIGEN_DATO`, `PARAMETROS`, `DEFECTO`, `ACTIVO`, `COMENTARIOS?`
- interface `Mad005DataSourceType` ? `IdOrigen`, `Origen`
- interface `Mad005DataLists` ? `origenDatos`, `ErrMensaje`
- interface `Mad005DataSourceConfigurationRecord` ? `ErrMensaje?`, `QFILTRO?`
- interface `Mad005BooleanOption` ? `text`, `value`

### [mad-005/services/mad-005.service.ts](../apps/mfe-mad/src/app/applications/mad-005/services/mad-005.service.ts)

- class `Mad005Service` ? `getApplicationId()`, `query()`, `save()`, `delete()`, `validateKey()`, `getDataLists()`, `getRecords()`, `validateDefault()`, `create()`, `update()`

### [mad-application.registry.ts](../apps/mfe-mad/src/app/applications/mad-application.registry.ts)

- type `MadApplicationLoader`
- interface `MadApplicationRegistration` ? `applicationId`, `load`
- const `MadApplicationRegistry`
- function `findMadApplication`

## mfe-malm

### [malm-application.registry.ts](../apps/mfe-malm/src/app/applications/malm-application.registry.ts)

- const `MalmApplicationRegistry`
- function `findMalmApplication`

## mfe-mcom

### [mcom-application.registry.ts](../apps/mfe-mcom/src/app/applications/mcom-application.registry.ts)

- const `McomApplicationRegistry`
- function `findMcomApplication`

### [ven-209/components/xtein-ven209-financieros/xtein-ven209-financieros.component.ts](../apps/mfe-mcom/src/app/applications/ven-209/components/xtein-ven209-financieros/xtein-ven209-financieros.component.ts)

- class `XteinVen209FinancierosComponent` ? `readOnly`, `cupoCredito`, `tiempoEntrega`, `condiciones`, `availableCondiciones`, `cupoCreditoChange`, `tiempoEntregaChange`, `condicionesChange`, `condicionColumns`, `expanded`, `toggleSection()`, `addModalOpen`, `selectedCondicionId`, `lookupColumns`, `gridToolbarActions`, `openModal()`, `closeModal()`, `saveCondicion()`, `onCupoChange()`, `onTiempoChange()`

### [ven-209/components/xtein-ven209-ubicaciones/xtein-ven209-ubicaciones.component.ts](../apps/mfe-mcom/src/app/applications/ven-209/components/xtein-ven209-ubicaciones/xtein-ven209-ubicaciones.component.ts)

- class `XteinVen209UbicacionesComponent` ? `readOnly`, `direcciones`, `telefonos`, `emails`, `contactoAdicional`, `direccionesChange`, `telefonosChange`, `emailsChange`, `contactoAdicionalChange`, `direccionColumns`, `telefonoColumns`, `emailColumns`, `expanded`, `toggleSection()`, `modalVisible`, `newDir`, `newTel`, `newEmail`, `dirToolbarActions`, `telToolbarActions`, `emailToolbarActions`, `openAddModal()`, `closeModal()`, `saveNewDireccion()`, `removeDireccion()`, `saveNewTelefono()`, `removeTelefono()`, `saveNewEmail()`, `removeEmail()`, `updateContacto()`

### [ven-209/constants/ven-209-catalog.constants.ts](../apps/mfe-mcom/src/app/applications/ven-209/constants/ven-209-catalog.constants.ts)

- const `Ven209Catalog`
- const `Ven209BusinessAction`

### [ven-209/constants/ven-209-logging.constants.ts](../apps/mfe-mcom/src/app/applications/ven-209/constants/ven-209-logging.constants.ts)

- const `createVen209Log`

### [ven-209/constants/ven-209-ui.constants.ts](../apps/mfe-mcom/src/app/applications/ven-209/constants/ven-209-ui.constants.ts)

- const `Ven209DefaultRecord`
- const `Ven209ClasesCliente`
- const `Ven209TiposPersona`
- const `Ven209Estados`
- interface `Ven209LookupColumnsConfig` ? `idLegal`, `grupos`, `zonas`, `adc`, `status`, `rt`
- interface `Ven209GridColumnsConfig` ? `direcciones`, `telefonos`, `emails`, `condiciones`
- const `Ven209LookupColumns`
- const `Ven209GridColumns`
- const `Ven209RecordViewColumns`

### [ven-209/constants/ven-209.constants.ts](../apps/mfe-mcom/src/app/applications/ven-209/constants/ven-209.constants.ts)

- const `Ven209Application`
- type `Ven209Application`
- const `Ven209Endpoint`
- type `Ven209Endpoint`
- const `Ven209ToolbarCapabilities`

### [ven-209/models/ven-209-business.model.ts](../apps/mfe-mcom/src/app/applications/ven-209/models/ven-209-business.model.ts)

- interface `Ven209SavePayload` ? `ACREEDOR`, `ADIC_ACREEDORES?`, `EMAIL?`, `DIRECCIONES?`, `TELEFONOS?`, `CONDICIONES?`, `CLIENTES_EVAL?`, `BANCOS?`, `USUARIO?`, `FECHA_REGISTRO?`
- interface `Ven209DeletePayload` ? `CLIENTES`, `USUARIO?`
- interface `Ven209FilterCriteria` ? `ESTRUCTURA?`

### [ven-209/models/ven-209.model.ts](../apps/mfe-mcom/src/app/applications/ven-209/models/ven-209.model.ts)

- interface `Ven209Direccion` ? `ID_DIRECCION?`, `TIPO_DIRECCION?`, `TIPO_NOMENCLATURA?`, `NOMENCLATURA?`, `NUMERO1?`, `NUMERO2?`, `DOMICILIO?`, `BARRIO?`, `DEPENDIENTE?`, `REFERENCIA?`, `ID_UBICACION?`, `CODIGO_POSTAL?`, `NOMBRE_UBICACION?`, `NOMBRE_BARRIO?`, `isEdit?`
- interface `Ven209Telefono` ? `ID_TELEFONO?`, `ID_DIRECCION?`, `TIPO_TELEFONO?`, `TELEFONO?`, `EXTENSION?`, `isEdit?`
- interface `Ven209Email` ? `ITEM?`, `EMAIL?`, `ETIQUETA?`, `isEdit?`
- interface `Ven209ContactoAdicional` ? `ID_CONTACTO?`, `EMAIL?`, `URL?`, `CIIU?`
- interface `Ven209Condicion` ? `ID_CONDICION`, `DESCRIPCION?`, `PLAZO?`, `DIAS_ENTREGA?`, `TIPO_CONDICION?`, `VALOR?`
- interface `Ven209Lookup` ? `ID_LEGAL?`, `NOMBRE_COMPLETO?`, `ID_GRUPO?`, `ID_GRUPO_PADRE?`, `NOMBRE?`, `TIPO?`, `PERSONA?`, `ID_ADC?`, `ID_UBICACION?`, `STATUS?`, `ID_RT?`, `DESCRIPCION?`, `CODIGO?`, `ID_CONDICION?`, `PLAZO?`
- interface `Ven209ClienteRecord` ? `ID_UN?`, `ID_CLIENTE?`, `ID_LEGAL?`, `ID_CLIENTE_PADRE?`, `PERFIL_TRIBUTARIO?`, `PERFIL_TASAS?`, `CLASE?`, `ID_GRUPO?`, `COMENTARIOS?`, `CONTACTO?`, `REPRESENTANTE_LEGAL?`, `ZONA?`, `ID_ADC?`, `STATUS?`, `CUPO_CREDITO?`, `CUPO_DISPONIBLE?`, `FRECUENCIA?`, `ESTADO?`, `CUPO_CUOTA?`, `CUPO_DIS_CUOTA?`, `ESTADO_CUPO?`, `ESTADO_CUOTA?`, `DESCRIPCION_CUPO?`, `NOMBRE_COMPLETO?`, `APELLIDO_COMPLETO?`, `NOMBRE?`, `NOMBRE2?`, `APELLIDO?`, `APELLIDO2?`, `TIPO_ID?`, `PERSONA?`, `FECHA_REGISTRO?`, `TIEMPO_ENTREGA?`, `DIRECCIONES?`, `TELEFONOS?`, `ITM_EMAIL?`, `ADIC_ACREEDORES?`, `CONDICIONES?`, `CONDICIONES_ADIC?`, `CLIENTES_PRO?`, `BANCOS?`, `RT?`, `QFILTRO?`, `ErrMensaje?`

### [ven-209/services/ven-209-business.service.ts](../apps/mfe-mcom/src/app/applications/ven-209/services/ven-209-business.service.ts)

- class `Ven209BusinessService` ? `identity`, `decode()`, `catalog()`, `loadIdLegalesWithTypes()`, `loadPerfilesTributarios()`, `validate()`, `buildSavePayload()`

### [ven-209/services/ven-209.service.ts](../apps/mfe-mcom/src/app/applications/ven-209/services/ven-209.service.ts)

- class `Ven209Service` ? `request()`, `getApplicationId()`, `query()`, `save()`, `delete()`, `getRecords()`, `create()`, `update()`

### [ven-209/ven-209.component.ts](../apps/mfe-mcom/src/app/applications/ven-209/ven-209.component.ts)

- class `Ven209Component` ? `applicationId`, `loading`, `mode`, `permissions`, `records`, `currentIndex`, `activeMainTab`, `direcciones`, `telefonos`, `emails`, `condiciones`, `contactoAdicional`, `idLegales`, `tiposId`, `personas`, `grupos`, `zonas`, `adcs`, `statuses`, `rts`, `availableCondiciones`, `perfilesTributarios`, `listaTasas`, `perfilColumns`, `perfilTasas`, `filterVisible`, `viewVisible`, `reportsVisible`, `settingsVisible`, `tableBase`, `viewColumns`, `clasesCliente`, `tiposPersona`, `estados`, `lookupCols`, `readOnly`, `isEditing`, `currentRecord`, `queryFilter`, `form`, `ngOnInit()`, `ngOnDestroy()`, `localDate()`, `newRecord()`, `editRecord()`, `saveRecord()`, `cancelEdit()`, `deleteRecord()`, `refresh()`, `searchRecords()`, `selectRecordIndex()`, `selectViewedRecord()`, `navigateRecord()`, `currentReportFilter()`, `onIdLegalChanged()`, `onPerfilTributarioSaved()`

### [ven-212/components/xtein-ven212-items/xtein-ven212-items.component.ts](../apps/mfe-mcom/src/app/applications/ven-212/components/xtein-ven212-items/xtein-ven212-items.component.ts)

- class `XteinVen212ItemsComponent` ? `items`, `recordKey`, `onlyStock`, `productsLoading`, `products`, `header`, `readOnly`, `ready`, `busy`, `conditionType`, `repeatItem`, `editPrice`, `persist`, `moneyFormat`, `quantityFormat`, `removed`, `removedMany`, `pending`, `refreshProducts`, `stockOnly`, `selected`, `draft`, `working`, `productsVisible`, `productDropdownOpened`, `productDropDownOptions`, `productColumns`, `minimumDate`, `ngOnChanges()`, `money()`, `quantity()`, `toggle()`, `allItemsSelected()`, `toggleAll()`, `deleteSelected()`, `onDraftQtyChange()`, `begin()`, `cancel()`, `remove()`, `product()`, `unit()`, `tax()`, `selectProductFromDropdown()`, `productToolbarActions()`, `presentationOptions()`, `taxOptions()`, `selectedTaxId()`, `commit()`

### [ven-212/constants/ven-212-catalog.constants.ts](../apps/mfe-mcom/src/app/applications/ven-212/constants/ven-212-catalog.constants.ts)

- const `Ven212Catalog`
- type `Ven212CatalogKey`
- const `Ven212BusinessAction`

### [ven-212/constants/ven-212-logging.constants.ts](../apps/mfe-mcom/src/app/applications/ven-212/constants/ven-212-logging.constants.ts)

- const `createVen212Log`

### [ven-212/constants/ven-212-ui.constants.ts](../apps/mfe-mcom/src/app/applications/ven-212/constants/ven-212-ui.constants.ts)

- const `Ven212RecordViewColumns`
- const `Ven212DefaultRecord`
- const `Ven212ClientColumns`
- const `Ven212UnitColumns`
- const `Ven212CurrencyColumns`
- const `Ven212SellerColumns`
- const `Ven212WarehouseColumns`
- const `Ven212ConditionColumns`
- const `Ven212BankColumns`

### [ven-212/constants/ven-212.constants.ts](../apps/mfe-mcom/src/app/applications/ven-212/constants/ven-212.constants.ts)

- const `Ven212Application`
- type `Ven212ApplicationId`
- const `Ven212Endpoint`
- type `Ven212Endpoint`
- const `Ven212Action`
- type `Ven212Action`
- const `Ven212ToolbarCapabilities`

### [ven-212/models/ven-212-business.model.ts](../apps/mfe-mcom/src/app/applications/ven-212/models/ven-212-business.model.ts)

- interface `Ven212Lookup` ? `ID_TASA?`, `DESCRIPCION?`, `CAN_INV?`, `ID_DOCUMENTO?`, `DOCUMENTO?`, `CONSECUTIVO?`, `PREFIJO?`, `SUFIJO?`, `ID_UN?`, `NOMBRE?`, `ID_CLIENTE?`, `NOMBRE_COMPLETO?`, `ID_UBICACION?`, `DIRECCION?`, `ID_ADC?`, `ID_MONEDA?`, `CODIGO?`, `TIPO?`, `PLAZOS?`, `PLAZO?`, `DIAS_VENC?`, `NOMBRE_OBJETO?`, `VALOR_DEFECTO?`, `ACTIVADO?`, `FORMATO?`, `PRODUCTO?`, `PRECIO?`, `VALOR_BASE?`, `PORC_IVA?`, `REFERENCIA?`, `PRESENTACION?`, `IVAS?`, `UDM_VENTA?`, `UDM_COMPRA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `PORCENTAJE?`, `VALOR?`, `CONFIG?`, `BANCO?`, `ErrMensaje?`
- interface `Ven212Details` ? `ErrMensaje?`, `ITM_FACTURA?`, `FACTURA_GRAV_AUX?`, `FACTURA_GRAV?`, `FACTURA_PAGOS?`
- interface `Ven212TaxResult` ? `ENCAB?`, `ITEMS?`
- interface `Ven212SettingResult` ? `ErrMensaje?`, `tipoAccion?`, `titulo?`, `modoSeleccion?`, `dataSource?`, `colsConfig?`, `container?`, `height?`, `width?`, `EMAIL?`, `NIT_EMPRESA?`, `dataElecStatus?`, `ITM_FACTURA?`, `DATA_GRAV?`, `GRID_TOTALES?`, `FACTURA?`, `DATA_FIN?`
- type `Ven212Header`

### [ven-212/models/ven-212-electronic.model.ts](../apps/mfe-mcom/src/app/applications/ven-212/models/ven-212-electronic.model.ts)

- interface `Ven212ElectronicDocument` ? `tipoDocElectronico`, `ID_DOCUMENTO`, `NC_DOCUMENTO`, `ID_EMPRESA`, `EMISOR_NIT`
- interface `Ven212ElectronicView` ? `document`, `date`, `client`, `email`, `cufe`, `qr`

### [ven-212/models/ven-212.model.ts](../apps/mfe-mcom/src/app/applications/ven-212/models/ven-212.model.ts)

- interface `Ven212FacturaRecord` ? `FACTURA_GRAV?`, `FACTURA_PAGOS?`, `Factura_GRAV?`, `Factura_PAGOS?`, `ID_UN`, `ID_UN_ITEM?`, `ID_DOCUMENTO`, `NOMBRE_DOCUMENTO?`, `PREFIJO`, `CONSECUTIVO`, `SUFIJO`, `DOCUMENTO`, `DOCUMENTO_FAC?`, `FECHA_REGISTRO?`, `FECHA`, `HORA?`, `ID_CLIENTE`, `NOMBRE_CLIENTE?`, `ID_ADC?`, `ID_CONDICION?`, `DESCRIPCION?`, `ID_MONEDA?`, `TASA_CAMBIO?`, `VIGENCIA?`, `ID_DOC_SOPORTE?`, `NC_DOC_SOPORTE?`, `FECHA_AUTORIZACION?`, `CUOTA_INICIAL?`, `PLAZO?`, `CONDICIONES_GENERALES?`, `SUB_TOTAL`, `VALOR_DESCUENTO`, `GRAVAMENES?`, `VALOR_COSTOS?`, `TOTAL`, `TIPO_VENTA?`, `VALOR_CUOTA?`, `VALOR_PRIMER_CUOTA?`, `FECHA_PRIMER_VENC?`, `DIAS_CUOTA?`, `UM_DIAS_CUOTA?`, `USUARIO`, `ESTADO`, `VALOR_FIN_COSTOS?`, `FECHA_OC?`, `ID_UBICACION?`, `DIRECCION?`, `ID_UN_BODEGA?`, `CUFE?`, `VALOR_BASE?`, `FECHA_ULT_VENC?`, `CLIENTE_PADRE?`, `BANCO?`, `ErrMensaje?`, `QFILTRO?`, `ITM_FACTURA?`, `ITM_Factura?`
- interface `Ven212PresentacionItem` ? `UDM_VENTA?`, `UDM_COMPRA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `PRECIO?`
- interface `Ven212IvaItem` ? `ID_TASA`, `TASA?`, `PORCENTAJE?`, `CLASE?`, `BASE?`, `VALOR?`
- interface `Ven212FacturaItem` ? `ID_UN?`, `ID_UN_ITEM?`, `ID_DOCUMENTO?`, `PREFIJO?`, `CONSECUTIVO?`, `SUFIJO?`, `ITEM`, `PRODUCTO`, `NOMBRE_PRODUCTO?`, `REFERENCIA?`, `ATRIBUTO?`, `ID_SOPORTE?`, `NC_PREFIJO?`, `NC_CONSECUTIVO?`, `NC_SUFIJO?`, `SOPORTE?`, `CANTIDAD`, `CANTIDAD_AUTORIZADA?`, `CANTIDAD_PENDIENTE?`, `CANTIDAD_REAL?`, `VALOR_BASE?`, `VALOR_UNITARIO`, `SUB_TOTAL`, `VALOR_DESCUENTO?`, `VALOR_COSTOS?`, `VALOR_IVA?`, `POR_IVA?`, `PORC_IVA?`, `GRAVAMENES?`, `GRAV_TOTAL?`, `GRAV_ORG?`, `TOTAL`, `UDM_VENTA?`, `UDM_COMPRA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `FECHA?`, `ESTADO?`, `PRECIO?`, `APLICACION?`, `PRESENTACION?`, `IVAS?`
- interface `Ven212FacturaGrav` ? `ID_UN?`, `ID_DOCUMENTO?`, `PREFIJO?`, `CONSECUTIVO?`, `SUFIJO?`, `ITEM?`, `APLICACION?`, `ID_TASA?`, `CLASE?`, `POR_TASA?`, `VALOR?`, `BASE?`
- interface `Ven212FacturaGravAux` ? `ITEM`, `PRODUCTO`, `ATRIBUTO`, `GRAV_ORG?`, `GRAVAMENES?`, `GRAV_TOTAL?`, `CANTIDAD`, `VALOR_UNITARIO`, `VALOR_DESCUENTO`, `VALOR_IVA`, `SUB_TOTAL`, `TOTAL`
- interface `Ven212FacturaPago` ? `ITEM`, `ID_RECAUDO`, `NC_RECAUDO`, `FECHA?`, `ID_PEDIDO?`, `NC_PEDIDO?`, `SALDO?`, `VALOR`, `TOTAL?`
- interface `Ven212Option` ? `text`, `value`

### [ven-212/services/ven-212-business.service.ts](../apps/mfe-mcom/src/app/applications/ven-212/services/ven-212-business.service.ts)

- class `Ven212BusinessService` ? `identity`, `decode()`, `catalog()`, `action()`, `taxes()`, `validate()`

### [ven-212/services/ven-212-electronic.service.ts](../apps/mfe-mcom/src/app/applications/ven-212/services/ven-212-electronic.service.ts)

- class `Ven212ElectronicService` ? `send()`, `pdf()`, `companyId`

### [ven-212/services/ven-212.service.ts](../apps/mfe-mcom/src/app/applications/ven-212/services/ven-212.service.ts)

- class `Ven212Service` ? `request()`, `getApplicationId()`, `query()`, `save()`, `delete()`, `getRecords()`, `create()`, `update()`

### [ven-212/ven-212.component.ts](../apps/mfe-mcom/src/app/applications/ven-212/ven-212.component.ts)

- class `Ven212Component` ? `applicationId`, `tableBase`, `viewColumns`, `clientColumns`, `unitColumns`, `currencyColumns`, `sellerColumns`, `warehouseColumns`, `conditionColumns`, `bankColumns`, `mode`, `records`, `currentIndex`, `busy`, `itemPending`, `permissions`, `items`, `taxes`, `taxItems`, `payments`, `documents`, `clients`, `addresses`, `sellers`, `units`, `warehouses`, `currencies`, `conditions`, `banks`, `terms`, `saleTypes`, `products`, `productsLoading`, `onlyStock`, `filterVisible`, `viewVisible`, `reportsVisible`, `settingsVisible`, `readOnly`, `isEditing`, `isNew`, `currentRecord`, `header`, `headerLocked`, `advances`, `totalTaxes`, `queryFilter`, `stateStyle`, `itemsReady`, `itemRecordKey`, `conditionType`, `persistItemBind`, `currentReportFilter`, `reportEmailContext()`, `onItemPending()`, `form`, `ngOnInit()`, `ngOnDestroy()`, `newRecord()`, `editRecord()`, `cancelEdit()`, `saveRecord()`, `deleteRecord()`, `refresh()`, `selectRecordIndex()`, `navigateRecord()`, `selectViewedRecord()`, `searchRecords()`, `persistItem()`, `removeItem()`, `removeItems()`, `applyItems()`, `recalculate()`, `onClientChanged()`, `onUnitChanged()`, `onConditionChanged()`, `loadProducts()`, `money()`, `onSettingSelected()`

### [ven-229/components/xtein-ven229-items/xtein-ven229-items.component.ts](../apps/mfe-mcom/src/app/applications/ven-229/components/xtein-ven229-items/xtein-ven229-items.component.ts)

- class `XteinVen229ItemsComponent` ? `items`, `recordKey`, `onlyStock`, `productsLoading`, `products`, `header`, `readOnly`, `ready`, `busy`, `conditionType`, `repeatItem`, `editPrice`, `persist`, `moneyFormat`, `quantityFormat`, `removed`, `removedMany`, `pending`, `refreshProducts`, `stockOnly`, `selected`, `draft`, `working`, `productsVisible`, `productDropdownOpened`, `productDropDownOptions`, `productColumns`, `minimumDeliveryDate`, `ngOnChanges()`, `money()`, `quantity()`, `toggle()`, `allItemsSelected()`, `toggleAll()`, `deleteSelected()`, `onDraftQtyChange()`, `begin()`, `cancel()`, `product()`, `unit()`, `tax()`, `selectProductFromDropdown()`, `productToolbarActions()`, `presentationOptions()`, `taxOptions()`, `selectedTaxId()`, `commit()`

### [ven-229/constants/ven-229-catalog.constants.ts](../apps/mfe-mcom/src/app/applications/ven-229/constants/ven-229-catalog.constants.ts)

- const `Ven229Catalog`
- const `Ven229BusinessAction`

### [ven-229/constants/ven-229-logging.constants.ts](../apps/mfe-mcom/src/app/applications/ven-229/constants/ven-229-logging.constants.ts)

- const `createVen229Log`

### [ven-229/constants/ven-229-ui.constants.ts](../apps/mfe-mcom/src/app/applications/ven-229/constants/ven-229-ui.constants.ts)

- const `Ven229RecordViewColumns`
- const `Ven229StatusOptions`
- const `Ven229TipoVentaOptions`
- const `Ven229DefaultRecord`
- const `Ven229ClientColumns`
- const `Ven229UnitColumns`
- const `Ven229CurrencyColumns`
- const `Ven229SellerColumns`
- const `Ven229WarehouseColumns`
- const `Ven229ConditionColumns`

### [ven-229/constants/ven-229.constants.ts](../apps/mfe-mcom/src/app/applications/ven-229/constants/ven-229.constants.ts)

- const `Ven229Application`
- type `Ven229Application`
- const `Ven229Endpoint`
- type `Ven229Endpoint`
- const `Ven229Action`
- type `Ven229Action`
- const `Ven229ToolbarCapabilities`

### [ven-229/models/ven-229-business.model.ts](../apps/mfe-mcom/src/app/applications/ven-229/models/ven-229-business.model.ts)

- interface `Ven229Lookup` ? `ID_TASA?`, `DESCRIPCION?`, `CAN_INV?`, `ID_DOCUMENTO?`, `DOCUMENTO?`, `CONSECUTIVO?`, `PREFIJO?`, `SUFIJO?`, `ID_UN?`, `NOMBRE?`, `ID_CLIENTE?`, `NOMBRE_COMPLETO?`, `ID_UBICACION?`, `DIRECCION?`, `ID_ADC?`, `ID_MONEDA?`, `CODIGO?`, `TIPO?`, `PLAZOS?`, `PLAZO?`, `DIAS_VENC?`, `NOMBRE_OBJETO?`, `VALOR_DEFECTO?`, `ACTIVADO?`, `FORMATO?`, `PRODUCTO?`, `PRECIO?`, `VALOR_BASE?`, `PORC_IVA?`, `REFERENCIA?`, `PRESENTACION?`, `IVAS?`, `UDM_VENTA?`, `UDM_COMPRA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `PORCENTAJE?`, `VALOR?`, `CONFIG?`, `ErrMensaje?`
- interface `Ven229Details` ? `ErrMensaje?`, `ITM_PEDIDO?`, `PEDIDO_GRAV_AUX?`, `PEDIDO_GRAV?`, `PEDIDO_PAGOS?`
- interface `Ven229TaxResult` ? `ENCAB?`, `ITEMS?`
- interface `Ven229SettingResult` ? `tipoAccion?`, `dataSource?`, `titulo?`, `modoSeleccion?`, `colsConfig?`, `container?`, `dataElecStatus?`, `EMAIL?`, `NIT_EMPRESA?`, `ITM_Pedido?`, `DATA_GRAV?`
- type `Ven229Header`

### [ven-229/models/ven-229.model.ts](../apps/mfe-mcom/src/app/applications/ven-229/models/ven-229.model.ts)

- interface `Ven229PedidoRecord` ? `PEDIDO_GRAV?`, `PEDIDO_PAGOS?`, `Pedido_GRAV?`, `Pedido_PAGOS?`, `ID_UN`, `ID_UN_ITEM?`, `ID_DOCUMENTO`, `NOMBRE_DOCUMENTO?`, `PREFIJO`, `CONSECUTIVO`, `SUFIJO`, `DOCUMENTO`, `DOCUMENTO_FAC?`, `FECHA_REGISTRO?`, `FECHA`, `HORA?`, `ID_CLIENTE`, `NOMBRE_CLIENTE?`, `ID_ADC?`, `ID_CONDICION?`, `DESCRIPCION?`, `ID_MONEDA?`, `TASA_CAMBIO?`, `VIGENCIA?`, `ID_DOC_SOPORTE?`, `NC_DOC_SOPORTE?`, `FECHA_AUTORIZACION?`, `CUOTA_INICIAL?`, `PLAZO?`, `CONDICIONES_GENERALES?`, `SUB_TOTAL`, `VALOR_DESCUENTO`, `GRAVAMENES?`, `VALOR_COSTOS?`, `TOTAL`, `TIPO_VENTA?`, `VALOR_CUOTA?`, `VALOR_PRIMER_CUOTA?`, `FECHA_PRIMER_VENC?`, `DIAS_CUOTA?`, `UM_DIAS_CUOTA?`, `USUARIO`, `ESTADO`, `VALOR_FIN_COSTOS?`, `FECHA_OC?`, `ID_UBICACION?`, `DIRECCION?`, `ID_UN_BODEGA?`, `CUFE?`, `VALOR_BASE?`, `ErrMensaje?`, `QFILTRO?`
- interface `Ven229PresentacionItem` ? `UDM_VENTA?`, `UDM_COMPRA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`
- interface `Ven229IvaItem` ? `ID_TASA`, `TASA?`, `PORCENTAJE?`, `CLASE?`, `BASE?`, `VALOR?`
- interface `Ven229PedidoItem` ? `ID_UN?`, `ID_UN_ITEM?`, `ID_DOCUMENTO?`, `PREFIJO?`, `CONSECUTIVO?`, `SUFIJO?`, `ITEM`, `PRODUCTO`, `NOMBRE_PRODUCTO?`, `REFERENCIA?`, `ATRIBUTO?`, `ID_SOPORTE?`, `NC_PREFIJO?`, `NC_CONSECUTIVO?`, `NC_SUFIJO?`, `SOPORTE?`, `CANTIDAD`, `CANTIDAD_AUTORIZADA?`, `CANTIDAD_PENDIENTE?`, `VALOR_BASE?`, `VALOR_UNITARIO`, `SUB_TOTAL`, `VALOR_DESCUENTO?`, `VALOR_COSTOS?`, `VALOR_IVA?`, `POR_IVA?`, `PORC_IVA?`, `GRAVAMENES?`, `GRAV_TOTAL?`, `GRAV_ORG?`, `TOTAL`, `UDM_VENTA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `FECHA?`, `FECHA_ENTREGA?`, `ESTADO?`, `PRECIO?`, `APLICACION?`, `PRESENTACION?`, `IVAS?`
- interface `Ven229PedidoGrav` ? `ID_UN?`, `ID_DOCUMENTO?`, `PREFIJO?`, `CONSECUTIVO?`, `SUFIJO?`, `ITEM?`, `APLICACION?`, `ID_TASA?`, `CLASE?`, `POR_TASA?`, `VALOR?`, `BASE?`
- interface `Ven229PedidoGravAux` ? `ITEM`, `PRODUCTO`, `ATRIBUTO`, `GRAV_ORG?`, `GRAVAMENES?`, `GRAV_TOTAL?`, `CANTIDAD`, `VALOR_UNITARIO`, `VALOR_DESCUENTO`, `VALOR_IVA`, `SUB_TOTAL`, `TOTAL`
- interface `Ven229PedidoPago` ? `ITEM`, `ID_RECAUDO`, `NC_RECAUDO`, `FECHA?`, `ID_PEDIDO?`, `NC_PEDIDO?`, `SALDO?`, `VALOR`, `TOTAL?`
- interface `Ven229Option` ? `text`, `value`

### [ven-229/services/ven-229-business.service.ts](../apps/mfe-mcom/src/app/applications/ven-229/services/ven-229-business.service.ts)

- class `Ven229BusinessService` ? `identity`, `decode()`, `catalog()`, `action()`, `taxes()`, `validate()`

### [ven-229/services/ven-229.service.ts](../apps/mfe-mcom/src/app/applications/ven-229/services/ven-229.service.ts)

- class `Ven229Service` ? `request()`, `getApplicationId()`, `query()`, `save()`, `delete()`, `getRecords()`, `create()`, `update()`

### [ven-229/ven-229.component.ts](../apps/mfe-mcom/src/app/applications/ven-229/ven-229.component.ts)

- class `Ven229Component` ? `applicationId`, `tableBase`, `viewColumns`, `clientColumns`, `unitColumns`, `currencyColumns`, `sellerColumns`, `warehouseColumns`, `conditionColumns`, `mode`, `records`, `currentIndex`, `busy`, `itemPending`, `permissions`, `items`, `taxes`, `taxItems`, `payments`, `documents`, `clients`, `addresses`, `sellers`, `units`, `warehouses`, `currencies`, `conditions`, `terms`, `saleTypes`, `products`, `productsLoading`, `onlyStock`, `filterVisible`, `viewVisible`, `reportsVisible`, `settingsVisible`, `readOnly`, `isEditing`, `isNew`, `currentRecord`, `header`, `headerLocked`, `advances`, `totalTaxes`, `queryFilter`, `stateStyle`, `itemsReady`, `itemRecordKey`, `conditionType`, `persistItemBind`, `currentReportFilter`, `reportEmailContext()`, `onItemPending()`, `form`, `ngOnInit()`, `ngOnDestroy()`, `newRecord()`, `editRecord()`, `cancelEdit()`, `saveRecord()`, `deleteRecord()`, `refresh()`, `selectRecordIndex()`, `navigateRecord()`, `selectViewedRecord()`, `searchRecords()`, `persistItem()`, `removeItem()`, `removeItems()`, `applyItems()`, `recalculate()`, `onClientChanged()`, `onUnitChanged()`, `onConditionChanged()`, `loadProducts()`, `money()`, `onSettingSelected()`

### [ven-230/components/xtein-ven230-items/xtein-ven230-items.component.ts](../apps/mfe-mcom/src/app/applications/ven-230/components/xtein-ven230-items/xtein-ven230-items.component.ts)

- class `XteinVen230ItemsComponent` ? `items`, `recordKey`, `onlyStock`, `productsLoading`, `products`, `header`, `readOnly`, `ready`, `busy`, `conditionType`, `repeatItem`, `editPrice`, `persist`, `moneyFormat`, `quantityFormat`, `money()`, `quantity()`, `selected`, `removedMany`, `toggle()`, `allItemsSelected()`, `toggleAll()`, `deleteSelected()`, `onDraftQtyChange()`, `removed`, `pending`, `refreshProducts`, `productsVisible`, `stockOnly`, `draft`, `working`, `begin()`, `cancel()`, `product()`, `unit()`, `tax()`, `commit()`, `productDropdownOpened`, `productDropDownOptions`, `productColumns`, `ngOnChanges()`, `minimumDeliveryDate`, `taxOptions()`, `selectedTaxId()`, `presentationOptions()`, `selectProductFromDropdown()`, `closeProductSearch()`, `productToolbarActions()`

### [ven-230/components/xtein-ven230-selection/xtein-ven230-selection.component.ts](../apps/mfe-mcom/src/app/applications/ven-230/components/xtein-ven230-selection/xtein-ven230-selection.component.ts)

- class `XteinVen230SelectionComponent` ? `config`, `visible`, `busy`, `initialKeys`, `visibleChange`, `accepted`, `grid?`, `rows`, `columns`, `keys`, `onlySelected`, `error`, `saving`, `pageSizes`, `ngOnChanges()`, `size()`, `selectionChanged()`, `editingStart()`, `filterSelected()`, `groupRows()`, `groupSelected()`, `groupPartial()`, `groupLabel()`, `toggleGroup()`, `apply()`

### [ven-230/constants/ven-230-catalog.constants.ts](../apps/mfe-mcom/src/app/applications/ven-230/constants/ven-230-catalog.constants.ts)

- const `Ven230Catalog`
- const `Ven230BusinessAction`

### [ven-230/constants/ven-230-electronic.constants.ts](../apps/mfe-mcom/src/app/applications/ven-230/constants/ven-230-electronic.constants.ts)

- const `Ven230ElectronicQrEndpoint`

### [ven-230/constants/ven-230-logging.constants.ts](../apps/mfe-mcom/src/app/applications/ven-230/constants/ven-230-logging.constants.ts)

- const `createVen230Log`

### [ven-230/constants/ven-230-ui.constants.ts](../apps/mfe-mcom/src/app/applications/ven-230/constants/ven-230-ui.constants.ts)

- const `Ven230RecordViewColumns`
- const `Ven230StatusOptions`
- const `Ven230TipoVentaOptions`
- const `Ven230DefaultRecord`
- const `Ven230ToolbarCapabilities`
- const `Ven230ClientColumns`
- const `Ven230UnitColumns`
- const `Ven230CurrencyColumns`
- const `Ven230SellerColumns`
- const `Ven230WarehouseColumns`
- const `Ven230ConditionColumns`

### [ven-230/constants/ven-230.constants.ts](../apps/mfe-mcom/src/app/applications/ven-230/constants/ven-230.constants.ts)

- const `Ven230Application`
- type `Ven230Application`
- const `Ven230Endpoint`
- type `Ven230Endpoint`
- const `Ven230Action`
- type `Ven230Action`

### [ven-230/models/ven-230-business.model.ts](../apps/mfe-mcom/src/app/applications/ven-230/models/ven-230-business.model.ts)

- interface `Ven230Lookup` ? `ID_TASA?`, `DESCRIPCION?`, `CAN_INV?`, `ID_DOCUMENTO?`, `DOCUMENTO?`, `CONSECUTIVO?`, `PREFIJO?`, `SUFIJO?`, `ID_UN?`, `NOMBRE?`, `ID_CLIENTE?`, `NOMBRE_COMPLETO?`, `ID_UBICACION?`, `DIRECCION?`, `ID_ADC?`, `ID_MONEDA?`, `CODIGO?`, `TIPO?`, `PLAZOS?`, `PLAZO?`, `DIAS_VENC?`, `NOMBRE_OBJETO?`, `VALOR_DEFECTO?`, `ACTIVADO?`, `FORMATO?`, `PRODUCTO?`, `PRECIO?`, `VALOR_BASE?`, `PORC_IVA?`, `REFERENCIA?`, `PRESENTACION?`, `IVAS?`, `UDM_VENTA?`, `UDM_COMPRA?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `PORCENTAJE?`, `VALOR?`, `CONFIG?`, `ErrMensaje?`
- interface `Ven230Details` ? `ErrMensaje?`, `ITM_PREFACTURA?`, `PREFACTURA_GRAV_AUX?`, `PREFACTURA_GRAV?`, `PREFACTURA_PAGOS?`
- interface `Ven230TaxResult` ? `ENCAB?`, `ITEMS?`
- interface `Ven230SettingResult` ? `tipoAccion?`, `dataSource?`, `titulo?`, `modoSeleccion?`, `colsConfig?`, `container?`, `dataElecStatus?`, `EMAIL?`, `NIT_EMPRESA?`, `ITM_Prefactura?`, `DATA_GRAV?`
- type `Ven230Header`

### [ven-230/models/ven-230-electronic.model.ts](../apps/mfe-mcom/src/app/applications/ven-230/models/ven-230-electronic.model.ts)

- interface `Ven230ElectronicDocument` ? `tipoDocElectronico`, `ID_DOCUMENTO`, `NC_DOCUMENTO`, `ID_EMPRESA`, `EMISOR_NIT`
- interface `Ven230ElectronicView` ? `document`, `date`, `client`, `email`, `cufe`, `qr`

### [ven-230/models/ven-230-record.model.ts](../apps/mfe-mcom/src/app/applications/ven-230/models/ven-230-record.model.ts)

- type `Ven230Record`

### [ven-230/models/ven-230-selection.model.ts](../apps/mfe-mcom/src/app/applications/ven-230/models/ven-230-selection.model.ts)

- type `Ven230SelectionColumn`

### [ven-230/models/ven-230.model.ts](../apps/mfe-mcom/src/app/applications/ven-230/models/ven-230.model.ts)

- interface `Ven230PrefacturaRecord` ? `PREFACTURA_GRAV?`, `PREFACTURA_PAGOS?`, `Prefactura_GRAV?`, `Prefactura_PAGOS?`, `ID_UN`, `ID_UN_ITEM?`, `ID_DOCUMENTO`, `NOMBRE_DOCUMENTO?`, `PREFIJO`, `CONSECUTIVO`, `SUFIJO`, `DOCUMENTO`, `DOCUMENTO_FAC?`, `FECHA_REGISTRO?`, `FECHA`, `HORA?`, `ID_CLIENTE`, `NOMBRE_CLIENTE?`, `ID_ADC?`, `ID_CONDICION?`, `DESCRIPCION?`, `ID_MONEDA?`, `TASA_CAMBIO?`, `VIGENCIA?`, `ID_DOC_SOPORTE?`, `NC_DOC_SOPORTE?`, `FECHA_AUTORIZACION?`, `CUOTA_INICIAL?`, `PLAZO?`, `CONDICIONES_GENERALES?`, `SUB_TOTAL`, `VALOR_DESCUENTO`, `GRAVAMENES?`, `VALOR_COSTOS?`, `TOTAL`, `TIPO_VENTA?`, `VALOR_CUOTA?`, `VALOR_PRIMER_CUOTA?`, `FECHA_PRIMER_VENC?`, `DIAS_CUOTA?`, `UM_DIAS_CUOTA?`, `USUARIO`, `ESTADO`, `VALOR_FIN_COSTOS?`, `FECHA_OC?`, `ID_UBICACION?`, `DIRECCION?`, `ID_UN_BODEGA?`, `CUFE?`, `VALOR_BASE?`, `ErrMensaje?`, `QFILTRO?`
- interface `Ven230PrefacturaItem` ? `FECHA_ENTREGA?`, `NOMBRE_PRODUCTO?`, `REFERENCIA?`, `PORC_IVA?`, `PRESENTACION?`, `IVAS?`, `UDM_EQUIV?`, `CANTIDAD_PRES?`, `CANTIDAD_EQUIV?`, `CANTIDAD_REAL?`, `APLICACION?`, `ID_UN?`, `ID_UN_ITEM?`, `ID_DOCUMENTO?`, `PREFIJO?`, `CONSECUTIVO?`, `SUFIJO?`, `ITEM`, `PRODUCTO`, `ATRIBUTO?`, `ID_SOPORTE?`, `NC_PREFIJO?`, `NC_CONSECUTIVO?`, `NC_SUFIJO?`, `SOPORTE?`, `CANTIDAD`, `CANTIDAD_AUTORIZADA?`, `CANTIDAD_PENDIENTE?`, `VALOR_BASE?`, `VALOR_UNITARIO`, `SUB_TOTAL`, `VALOR_DESCUENTO`, `VALOR_COSTOS?`, `VALOR_IVA`, `POR_IVA`, `GRAVAMENES?`, `GRAV_TOTAL?`, `GRAV_ORG?`, `TOTAL`, `UDM_VENTA?`, `FECHA?`, `ESTADO?`
- interface `Ven230PrefacturaPago` ? `ITEM`, `ID_RECAUDO`, `NC_RECAUDO`, `FECHA`, `ID_Prefactura`, `NC_Prefactura`, `SALDO`, `VALOR`
- interface `Ven230PrefacturaGrav` ? `ID_UN?`, `ID_DOCUMENTO?`, `PREFIJO?`, `CONSECUTIVO?`, `SUFIJO?`, `ITEM`, `APLICACION?`, `ID_TASA`, `CLASE?`, `POR_TASA`, `VALOR`, `BASE`
- interface `Ven230Option` ? `text`, `value`
- interface `Ven230DataLists` ? `documentos?`, `clientes?`, `monedas?`, `condiciones?`, `unidadesNegocio?`, `tiposVenta?`, `bodegas?`

### [ven-230/services/ven-230-business.service.ts](../apps/mfe-mcom/src/app/applications/ven-230/services/ven-230-business.service.ts)

- class `Ven230BusinessService` ? `identity`, `decode()`, `catalog()`, `action()`, `taxes()`, `validate()`

### [ven-230/services/ven-230-electronic.service.ts](../apps/mfe-mcom/src/app/applications/ven-230/services/ven-230-electronic.service.ts)

- class `Ven230ElectronicService` ? `send()`, `pdf()`, `companyId`

### [ven-230/services/ven-230-selection.service.ts](../apps/mfe-mcom/src/app/applications/ven-230/services/ven-230-selection.service.ts)

- class `Ven230SelectionService` ? `columns()`, `validateRows()`, `groupFields()`

### [ven-230/services/ven-230.service.ts](../apps/mfe-mcom/src/app/applications/ven-230/services/ven-230.service.ts)

- class `Ven230Service` ? `request()`, `getApplicationId()`, `query()`, `save()`, `delete()`, `getRecords()`, `getAdditionalData()`, `create()`, `update()`

### [ven-230/utils/ven-230-validation-expression.ts](../apps/mfe-mcom/src/app/applications/ven-230/utils/ven-230-validation-expression.ts)

- function `compileValidation`

### [ven-230/ven-230.component.ts](../apps/mfe-mcom/src/app/applications/ven-230/ven-230.component.ts)

- class `Ven230Component` ? `clientColumns`, `unitColumns`, `currencyColumns`, `sellerColumns`, `warehouseColumns`, `conditionColumns`, `applicationId`, `tableBase`, `records`, `currentIndex`, `items`, `dataLists`, `unidadesNegocioOptions`, `monedasOptions`, `condicionesOptions`, `bodegasOptions`, `tipoVentaOptions`, `loading`, `mode`, `permissions`, `filterVisible`, `viewVisible`, `reportsVisible`, `readOnly`, `viewColumns`, `currentRecord`, `queryFilter`, `reportEmailContext()`, `form`, `ngOnInit()`, `ngOnDestroy()`, `currentReportFilter()`, `newRecord()`, `editRecord()`, `cancelEdit()`, `saveRecord()`, `deleteRecord()`, `refresh()`, `searchRecords()`, `selectRecordIndex()`, `selectViewedRecord()`, `navigateRecord()`, `documents`, `clients`, `sellers`, `addresses`, `conditions`, `products`, `terms`, `specifications`, `taxes`, `taxItems`, `payments`, `advances`, `itemPending`, `detailsReady`, `headerLocked`, `settingsVisible`, `settings`, `selectionVisible`, `selection`, `selectedSettingsRows`, `selectedSettingsKeys`, `conditionType`, `onlyStock`, `header()`, `localDate()`, `spec()`, `enabledSpec()`, `itemsReady()`, `productsLoading`, `loadProducts()`, `commitItem()`, `removeItem()`, `restoreTaxes()`, `showSettings()`, `executeSetting()`, `applySelection()`, `electronicVisible`, `electronicBusy`, `electronicEvents`, `electronicView`, `electronicOperation`, `electronicQrUrl()`, `electronicDocument`, `sendElectronic()`, `downloadElectronic()`, `persistItem`, `onItemPending()`, `money()`, `stateStyle()`, `itemRecordKey()`

## mfe-mcpr

### [mcpr-application.registry.ts](../apps/mfe-mcpr/src/app/applications/mcpr-application.registry.ts)

- const `McprApplicationRegistry`
- function `findMcprApplication`

## mfe-men

### [men-application.registry.ts](../apps/mfe-men/src/app/applications/men-application.registry.ts)

- const `MenApplicationRegistry`
- function `findMenApplication`

## mfe-mfin

### [mfin-application.registry.ts](../apps/mfe-mfin/src/app/applications/mfin-application.registry.ts)

- const `MfinApplicationRegistry`
- function `findMfinApplication`

## mfe-mthu

### [mthu-application.registry.ts](../apps/mfe-mthu/src/app/applications/mthu-application.registry.ts)

- const `MthuApplicationRegistry`
- function `findMthuApplication`

## Legacy: m?dulos y declaraciones de modelos

Los servicios pueden estar en `Legacy/src/app/services`, dentro del m?dulo o compartidos con otra aplicaci?n. Seguir los imports de cada componente para determinar las dependencias reales.

### [ADM015](../Legacy/src/app/modulos/ADM015)

- [clsADM015.class.ts](../Legacy/src/app/modulos/ADM015/clsADM015.class.ts): `IData`, `ILista`, `clsUsuarios`, `clsAutorizaciones`, `clsPermisosEspeciales`, `clsUN_Asociadas`, `clsConexiones`, `clsSAplicaciones`

### [ADM201](../Legacy/src/app/modulos/ADM201)

- [clsADM201.class.ts](../Legacy/src/app/modulos/ADM201/clsADM201.class.ts): `Aplicaciones`

### [ADM202](../Legacy/src/app/modulos/ADM202)

- [clsADM202.class.ts](../Legacy/src/app/modulos/ADM202/clsADM202.class.ts): `MUDnegocios`, `CIDLegales`, `CUbicaciones`, `CListaResponsabels`, `CListaIdetificacion`, `CListaImagenes`, `CListaContabilidad`

### [ADM203](../Legacy/src/app/modulos/ADM203)

- [clsADM203.class.ts](../Legacy/src/app/modulos/ADM203/clsADM203.class.ts): `MGrupos`

### [ADM205](../Legacy/src/app/modulos/ADM205)

- [clsADM205.class.ts](../Legacy/src/app/modulos/ADM205/clsADM205.class.ts): `MILegales`

### [ADM207](../Legacy/src/app/modulos/ADM207)

- [ADM20702/clsADM20702.class.ts](../Legacy/src/app/modulos/ADM207/ADM20702/clsADM20702.class.ts): `Modulo`, `Aplicacion`, `TreeListItem`, `UnidadesNegocio`
- [clsADM207.class.ts](../Legacy/src/app/modulos/ADM207/clsADM207.class.ts): `MDocumentos`

### [ADM212](../Legacy/src/app/modulos/ADM212)

- [clsADM212.class.ts](../Legacy/src/app/modulos/ADM212/clsADM212.class.ts): `clsDominios`, `FDominios`, `clsDM_Asociadas`

### [ADM225](../Legacy/src/app/modulos/ADM225)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [ADM301](../Legacy/src/app/modulos/ADM301)

- [clsADM301.class.ts](../Legacy/src/app/modulos/ADM301/clsADM301.class.ts): `IData`, `ILista`, `clsCalendario`, `clsCalendarioItem`

### [ADM400](../Legacy/src/app/modulos/ADM400)

- [clsADM400.class.ts](../Legacy/src/app/modulos/ADM400/clsADM400.class.ts): `IData`, `ILista`, `clsConfigCodigos`, `clsConfigCodigosItems`

### [ADM401](../Legacy/src/app/modulos/ADM401)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [ADM410](../Legacy/src/app/modulos/ADM410)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [CAL001](../Legacy/src/app/modulos/CAL001)

- [clsCAL001.class.ts](../Legacy/src/app/modulos/CAL001/clsCAL001.class.ts): `MCalidad`, `MNoConformidad`

### [CAL002](../Legacy/src/app/modulos/CAL002)

- [clsCAL002.class.ts](../Legacy/src/app/modulos/CAL002/clsCAL002.class.ts): `clsPlanAccion`

### [COM01](../Legacy/src/app/modulos/COM01)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [COM200](../Legacy/src/app/modulos/COM200)

- [clsCOM200.class.ts](../Legacy/src/app/modulos/COM200/clsCOM200.class.ts): `IData`, `ILista`, `clsOrdenCompra`, `clsOrdenCompraItems`, `clsOrdenCompraGrav`, `clsOrdenCompraGravItems`

### [COM201](../Legacy/src/app/modulos/COM201)

- [clsCOM0201.class.ts](../Legacy/src/app/modulos/COM201/clsCOM0201.class.ts): `clsListas`

### [COM202](../Legacy/src/app/modulos/COM202)

- [clsCOM202.class.ts](../Legacy/src/app/modulos/COM202/clsCOM202.class.ts): `clsGestionCompra`

### [COM203](../Legacy/src/app/modulos/COM203)

- [clsCOM203.class.ts](../Legacy/src/app/modulos/COM203/clsCOM203.class.ts): `IData`, `ILista`, `clsMovimientos`, `clsMovimientosItems`, `clsMovimientosGrav`, `clsMovimientosGravItems`, `clsSerialesMov`, `RespuestaConfig`

### [COM207](../Legacy/src/app/modulos/COM207)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [CXC210](../Legacy/src/app/modulos/CXC210)

- [clsCXC2010.class.ts](../Legacy/src/app/modulos/CXC210/clsCXC2010.class.ts): `clsClientes`

### [CXC220](../Legacy/src/app/modulos/CXC220)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [CXP200](../Legacy/src/app/modulos/CXP200)

- [clsCXP200.class.ts](../Legacy/src/app/modulos/CXP200/clsCXP200.class.ts): `clsAcreedores`, `clsUbicaciones`, `clsCondicionesProv`, `clsAdicProveedores`, `clsProProveedores`

### [CXP201](../Legacy/src/app/modulos/CXP201)

- [clsCXP201.class.ts](../Legacy/src/app/modulos/CXP201/clsCXP201.class.ts): `clsConsecGexCxp`, `clsCuentasPagar`, `clsPreEgresos`

### [DIN001](../Legacy/src/app/modulos/DIN001)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [FIN202](../Legacy/src/app/modulos/FIN202)

- [clsFIN202.class.ts](../Legacy/src/app/modulos/FIN202/clsFIN202.class.ts): `IData`, `ILista`, `clsRecaudos`, `clsRecaudosPagos`, `clsRecaudosGrav`, `clsRecaudoGravAux`, `clsAbonos`

### [FIN221](../Legacy/src/app/modulos/FIN221)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [FIN224](../Legacy/src/app/modulos/FIN224)

- [clsFIN224.class.ts](../Legacy/src/app/modulos/FIN224/clsFIN224.class.ts): `clsCondicionesNego`

### [FIN230](../Legacy/src/app/modulos/FIN230)

- [FIN230.class.ts](../Legacy/src/app/modulos/FIN230/FIN230.class.ts): `Condicion`

### [FIN231](../Legacy/src/app/modulos/FIN231)

- [FIN231.class.ts](../Legacy/src/app/modulos/FIN231/FIN231.class.ts): `Asociado`

### [GEN](../Legacy/src/app/modulos/GEN)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [GES000](../Legacy/src/app/modulos/GES000)

- [Clase/clsGES000.class.ts](../Legacy/src/app/modulos/GES000/Clase/clsGES000.class.ts): `clsNewPoryect`, `clsGesActividades`

### [GES001](../Legacy/src/app/modulos/GES001)

- [clsGES001.class.ts](../Legacy/src/app/modulos/GES001/clsGES001.class.ts): `clsNewPoryect`, `clsGesActividadesoldddd`, `clsGesActividades`

### [GES002](../Legacy/src/app/modulos/GES002)

- [clsGES002.class.ts](../Legacy/src/app/modulos/GES002/clsGES002.class.ts): `clsOrganigrama`, `clsRol`

### [GES003](../Legacy/src/app/modulos/GES003)

- [clsGES003.class.ts](../Legacy/src/app/modulos/GES003/clsGES003.class.ts): `clsCargos`, `DataActividad`

### [GES004](../Legacy/src/app/modulos/GES004)

- [GES00401/clsGES00401.class.ts](../Legacy/src/app/modulos/GES004/GES00401/clsGES00401.class.ts): `FSGrupos`, `FGrupos`, `clsUS_Asociadas`

### [GES005](../Legacy/src/app/modulos/GES005)

- [clsGES005.class.ts](../Legacy/src/app/modulos/GES005/clsGES005.class.ts): `MAreas`

### [GES006](../Legacy/src/app/modulos/GES006)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [GES007](../Legacy/src/app/modulos/GES007)

- [GES00703/GES00703.class.ts](../Legacy/src/app/modulos/GES007/GES00703/GES00703.class.ts): `Task`, `Dependency`, `Resource`, `ResourceAssignment`

### [GESPRO](../Legacy/src/app/modulos/GESPRO)

- [clsGESPRO.class.ts](../Legacy/src/app/modulos/GESPRO/clsGESPRO.class.ts): `MActividad`, `Resource`, `MColaboradores`
- [GES000/Clase/clsGES000.class.ts](../Legacy/src/app/modulos/GESPRO/GES000/Clase/clsGES000.class.ts): `clsNewPoryect`, `clsGesActividades`

### [GHU-230](../Legacy/src/app/modulos/GHU-230)

- [clsGHU230.class.ts](../Legacy/src/app/modulos/GHU-230/clsGHU230.class.ts): `clsBonos`

### [GHU240](../Legacy/src/app/modulos/GHU240)

- [GHU240.class.ts](../Legacy/src/app/modulos/GHU240/GHU240.class.ts): `Empleado`

### [INV014](../Legacy/src/app/modulos/INV014)

- [clsINV014.class.ts](../Legacy/src/app/modulos/INV014/clsINV014.class.ts): `IData`, `ILista`, `clsEntradas`, `clsEntradasItems`

### [INV209](../Legacy/src/app/modulos/INV209)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [INV210](../Legacy/src/app/modulos/INV210)

- [clsINV210.class.ts](../Legacy/src/app/modulos/INV210/clsINV210.class.ts): `clsInventarios`

### [MEN](../Legacy/src/app/modulos/MEN)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [MEN1000](../Legacy/src/app/modulos/MEN1000)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO004](../Legacy/src/app/modulos/PRO004)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO005](../Legacy/src/app/modulos/PRO005)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO006](../Legacy/src/app/modulos/PRO006)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO007](../Legacy/src/app/modulos/PRO007)

- [PRO021/clsPRO021.class.ts](../Legacy/src/app/modulos/PRO007/PRO021/clsPRO021.class.ts): `MAtributos`, `MItemsAtributos`
- [PRO022/clsPRO022.class.ts](../Legacy/src/app/modulos/PRO007/PRO022/clsPRO022.class.ts): `IData`, `ILista`, `clsProductos`, `clsAtributos`, `clsProAtributos`, `clsPartes2`, `clsPartes`, `clsProductosPartes`, `clsProProveedores`, `clsCombos`, `clsBodegas`, `clsCubicaje`, `clsDocumentacion`, `clsUnidadesMedida`

### [PRO008](../Legacy/src/app/modulos/PRO008)

- [clsPRO008.class.ts](../Legacy/src/app/modulos/PRO008/clsPRO008.class.ts): `MSecciones`

### [PRO009](../Legacy/src/app/modulos/PRO009)

- [clsPRO009.class.ts](../Legacy/src/app/modulos/PRO009/clsPRO009.class.ts): `MEmpleados`

### [PRO009UP](../Legacy/src/app/modulos/PRO009UP)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO011](../Legacy/src/app/modulos/PRO011)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO019](../Legacy/src/app/modulos/PRO019)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO019UP](../Legacy/src/app/modulos/PRO019UP)

- [clsPRO019.class.ts](../Legacy/src/app/modulos/PRO019UP/clsPRO019.class.ts): `MMatriz`

### [PRO023](../Legacy/src/app/modulos/PRO023)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO024](../Legacy/src/app/modulos/PRO024)

- [clsPRO024.class.ts](../Legacy/src/app/modulos/PRO024/clsPRO024.class.ts): `FTurnos`

### [PRO025](../Legacy/src/app/modulos/PRO025)

- [clsPRO025.class.ts](../Legacy/src/app/modulos/PRO025/clsPRO025.class.ts): `IData`, `ILista`, `clsOrdenProduccion`, `clsOrdenProduccionItems`

### [PRO026](../Legacy/src/app/modulos/PRO026)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO027](../Legacy/src/app/modulos/PRO027)

- [clsPRO027.class.ts](../Legacy/src/app/modulos/PRO027/clsPRO027.class.ts): `IData`, `ILista`, `clsTransaccProduccion`, `clsTransaccProduccionOP`, `clsTransaccProduccionItems`

### [PRO028](../Legacy/src/app/modulos/PRO028)

- [clsPRO028.class.ts](../Legacy/src/app/modulos/PRO028/clsPRO028.class.ts): `CCapacidad`, `DSecciones`

### [PRO029](../Legacy/src/app/modulos/PRO029)

- [PRO02904/PRO02904.class.ts](../Legacy/src/app/modulos/PRO029/PRO02904/PRO02904.class.ts): `Task`, `Dependency`, `Resource`, `ResourceAssignment`

### [PRO030](../Legacy/src/app/modulos/PRO030)

- [clsPRO030.class.ts](../Legacy/src/app/modulos/PRO030/clsPRO030.class.ts): `clsOperRutas`

### [PRO031](../Legacy/src/app/modulos/PRO031)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO032](../Legacy/src/app/modulos/PRO032)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO033](../Legacy/src/app/modulos/PRO033)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [PRO034](../Legacy/src/app/modulos/PRO034)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [TEST](../Legacy/src/app/modulos/TEST)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [VEN002](../Legacy/src/app/modulos/VEN002)

Sin archivo `*.class.ts` en esta carpeta; revisar tipos y objetos dentro de los componentes.

### [VEN155](../Legacy/src/app/modulos/VEN155)

- [clsVEN155.class.ts](../Legacy/src/app/modulos/VEN155/clsVEN155.class.ts): `IData`, `ILista`, `clsPedidos`, `clsPedidosItems`, `clsPedidosGrav`

### [VEN208](../Legacy/src/app/modulos/VEN208)

- [clsVEN208.class.ts](../Legacy/src/app/modulos/VEN208/clsVEN208.class.ts): `IData`, `ILista`, `clsCotizacion`, `clsCotizacionItems`, `clsCotizacionGrav`

### [VEN209](../Legacy/src/app/modulos/VEN209)

- [clsVEN209.class.ts](../Legacy/src/app/modulos/VEN209/clsVEN209.class.ts): `clsClientes`, `clsUbicaciones`, `clsCondicionesProv`, `clsAdicProveedores`, `clsProProveedores`

### [VEN212](../Legacy/src/app/modulos/VEN212)

- [clsVEN212.class.ts](../Legacy/src/app/modulos/VEN212/clsVEN212.class.ts): `IData`, `ILista`, `clsFacturas`, `clsFacturasPagos`, `clsFacturasItems`, `clsFacturasGrav`, `clsFacturaGravAux`

### [VEN229](../Legacy/src/app/modulos/VEN229)

- [clsVEN229.class.ts](../Legacy/src/app/modulos/VEN229/clsVEN229.class.ts): `IData`, `ILista`, `clsPedidos`, `clsPedidosPagos`, `clsPedidosItems`, `clsPedidosGrav`, `clsPedidoGravAux`

### [VEN230](../Legacy/src/app/modulos/VEN230)

- [clsVEN230.class.ts](../Legacy/src/app/modulos/VEN230/clsVEN230.class.ts): `IData`, `ILista`, `clsPrefacturas`, `clsPrefacturasPagos`, `clsPrefacturasItems`, `clsPrefacturasGrav`, `clsPrefacturaGravAux`

