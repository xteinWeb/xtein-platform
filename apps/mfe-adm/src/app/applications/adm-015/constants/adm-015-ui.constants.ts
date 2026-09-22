import { XteinRecordViewColumn } from '@xtein/ui';

export const Adm015Estados = ['ACTIVO', 'INACTIVO'] as const;

export const Adm015ExpirarOptions = ['No Expirar', 'Expirar cada'] as const;

export const Adm015Intervalos = [
  { value: 0, label: 'Días' },
  { value: 1, label: 'Semanas' }
] as const;

export const Adm015RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'USUARIO', caption: 'Usuario' },
  { dataField: 'NOMBRE', caption: 'Nombre' },
  { dataField: 'ID_ROL', caption: 'Rol' },
  { dataField: 'ESTADO', caption: 'Estado' },
  { dataField: 'EMAIL', caption: 'Correo Electrónico' }
];

export const Adm015DefaultRecord = {
  USUARIO: '',
  NOMBRE: '',
  ID_ROL: '',
  FECHA_CREACION: '',
  CLAVE_PRIMARIA: '',
  CLAVE_SECUNDARIA: '',
  CLAVE_TERCIARIA: '',
  EXPIRARstr: 'No Expirar',
  EXPIRAR: false,
  TIEMPO_INTERVALO: 0,
  INTERVALO: 0,
  CAMBIAR_CLAVE: true,
  ESTADO: 'ACTIVO',
  FECHA_CONFIGURACION: '',
  IMAGEN: '',
  EMAIL: '',
  TIEMPO_SESION: 0
};
