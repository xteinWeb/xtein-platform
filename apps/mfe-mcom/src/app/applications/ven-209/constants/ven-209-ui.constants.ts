import type { XteinGridColumn, XteinRecordViewColumn } from '@xtein/ui';
import type {
  Ven209ClienteRecord,
  Ven209Condicion,
  Ven209Direccion,
  Ven209Email,
  Ven209Lookup,
  Ven209Telefono
} from '../models/ven-209.model';

/**
 * Initial empty client record.
 */
export const Ven209DefaultRecord: Readonly<Ven209ClienteRecord> = {
  ID_UN: '',
  ID_CLIENTE: '',
  ID_LEGAL: '',
  ID_CLIENTE_PADRE: '',
  PERFIL_TRIBUTARIO: '',
  PERFIL_TASAS: [],
  CLASE: 'CLIENTES',
  ID_GRUPO: '',
  COMENTARIOS: '',
  CONTACTO: '',
  REPRESENTANTE_LEGAL: '',
  ZONA: '',
  ID_ADC: '',
  STATUS: '',
  CUPO_CREDITO: 0,
  CUPO_DISPONIBLE: 0,
  FRECUENCIA: 0,
  ESTADO: 'ACTIVO',
  CUPO_CUOTA: 0,
  CUPO_DIS_CUOTA: 0,
  ESTADO_CUPO: '',
  ESTADO_CUOTA: '',
  DESCRIPCION_CUPO: '',
  NOMBRE_COMPLETO: '',
  APELLIDO_COMPLETO: '',
  NOMBRE: '',
  NOMBRE2: '',
  APELLIDO: '',
  APELLIDO2: '',
  TIPO_ID: 'NIT',
  PERSONA: 'JURIDICA',
  FECHA_REGISTRO: null,
  TIEMPO_ENTREGA: 0,
  DIRECCIONES: [],
  TELEFONOS: [],
  ITM_EMAIL: [],
  ADIC_ACREEDORES: { URL: '', CIIU: '' },
  CONDICIONES: [],
  CONDICIONES_ADIC: {},
  CLIENTES_PRO: [],
  BANCOS: [],
  RT: []
};

export const Ven209ClasesCliente = [
  'CLIENTES',
  'SOCIOS',
  'EMPLEADOS',
  'CREDITO',
  'CONTADO',
  'FINANCIERO',
  'VINCULADOS ECONOMICOS',
  'GASTOS',
  'OTROS',
  'SERVICIOS TECNICOS',
  'LEASING',
  'HONORARIOS'
] as const;

export const Ven209TiposPersona = ['NATURAL', 'JURIDICA'] as const;

export const Ven209Estados = ['ACTIVO', 'INACTIVO'] as const;

export interface Ven209LookupColumnsConfig {
  idLegal: XteinGridColumn<Ven209Lookup, unknown>[];
  grupos: XteinGridColumn<Ven209Lookup, unknown>[];
  zonas: XteinGridColumn<Ven209Lookup, unknown>[];
  adc: XteinGridColumn<Ven209Lookup, unknown>[];
  status: XteinGridColumn<Ven209Lookup, unknown>[];
  rt: XteinGridColumn<Ven209Lookup, unknown>[];
}

export interface Ven209GridColumnsConfig {
  direcciones: XteinGridColumn<Ven209Direccion, unknown>[];
  telefonos: XteinGridColumn<Ven209Telefono, unknown>[];
  emails: XteinGridColumn<Ven209Email, unknown>[];
  condiciones: XteinGridColumn<Ven209Condicion, unknown>[];
}

export const Ven209LookupColumns: Ven209LookupColumnsConfig = {
  idLegal: [
    { dataField: 'ID_LEGAL', caption: 'Identificación Legal', width: 140 },
    { dataField: 'NOMBRE_COMPLETO', caption: 'Nombre / Razón Social' }
  ],
  grupos: [
    { dataField: 'ID_GRUPO', caption: 'Código', width: 120 },
    { dataField: 'NOMBRE', caption: 'Grupo de Clientes' }
  ],
  zonas: [
    { dataField: 'ID_UBICACION', caption: 'Código', width: 120 },
    { dataField: 'NOMBRE', caption: 'Zona' }
  ],
  adc: [
    { dataField: 'ID_ADC', caption: 'Código', width: 110 },
    { dataField: 'NOMBRE_COMPLETO', caption: 'Asesor Comercial / Vendedor' }
  ],
  status: [
    { dataField: 'STATUS', caption: 'Status' }
  ],
  rt: [
    { dataField: 'ID_RT', caption: 'Código', width: 120 },
    { dataField: 'DESCRIPCION', caption: 'Descripción' }
  ]
};

export const Ven209GridColumns: Ven209GridColumnsConfig = {
  direcciones: [
    { dataField: 'TIPO_DIRECCION', caption: 'Tipo', width: 110 },
    { dataField: 'DOMICILIO', caption: 'Dirección Principal' },
    { dataField: 'BARRIO', caption: 'Barrio', width: 150 },
    { dataField: 'NOMBRE_UBICACION', caption: 'Ciudad / Municipio', width: 180 },
    { dataField: 'CODIGO_POSTAL', caption: 'C.P.', width: 90 }
  ],
  telefonos: [
    { dataField: 'TIPO_TELEFONO', caption: 'Tipo', width: 120 },
    { dataField: 'TELEFONO', caption: 'Número Telefónico' },
    { dataField: 'EXTENSION', caption: 'Ext.', width: 100 }
  ],
  emails: [
    { dataField: 'EMAIL', caption: 'Correo Electrónico' },
    { dataField: 'ETIQUETA', caption: 'Etiqueta / Uso', width: 160 }
  ],
  condiciones: [
    { dataField: 'ID_CONDICION', caption: 'Código', width: 130 },
    { dataField: 'DESCRIPCION', caption: 'Condición Comercial' },
    { dataField: 'PLAZO', caption: 'Plazo (Días)', width: 110, alignment: 'right' },
    { dataField: 'DIAS_ENTREGA', caption: 'Días Entrega', width: 110, alignment: 'right' }
  ]
};

export const Ven209RecordViewColumns = [
  { dataField: 'ID_CLIENTE', caption: 'Código' },
  { dataField: 'ID_LEGAL', caption: 'Identificación Legal' },
  { dataField: 'NOMBRE_COMPLETO', caption: 'Nombre / Razón Social' },
  { dataField: 'CLASE', caption: 'Clase' },
  { dataField: 'ID_GRUPO', caption: 'Grupo' },
  { dataField: 'ESTADO', caption: 'Estado' }
];
