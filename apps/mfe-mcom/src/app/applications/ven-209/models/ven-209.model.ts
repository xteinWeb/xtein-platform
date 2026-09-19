export interface Ven209Direccion {
  ID_DIRECCION?: number;
  TIPO_DIRECCION?: string;
  TIPO_NOMENCLATURA?: string;
  NOMENCLATURA?: string;
  NUMERO1?: string;
  NUMERO2?: string;
  DOMICILIO?: string;
  BARRIO?: string;
  DEPENDIENTE?: string;
  REFERENCIA?: string;
  ID_UBICACION?: string;
  CODIGO_POSTAL?: string;
  NOMBRE_UBICACION?: string;
  NOMBRE_BARRIO?: string;
  isEdit?: boolean;
}

export interface Ven209Telefono {
  ID_TELEFONO?: number;
  ID_DIRECCION?: number;
  TIPO_TELEFONO?: string;
  TELEFONO?: string;
  EXTENSION?: string;
  isEdit?: boolean;
}

export interface Ven209Email {
  ITEM?: number;
  EMAIL?: string;
  ETIQUETA?: string;
  isEdit?: boolean;
}

export interface Ven209ContactoAdicional {
  ID_CONTACTO?: number;
  EMAIL?: string;
  URL?: string;
  CIIU?: string;
}

export interface Ven209Condicion {
  ID_CONDICION: string;
  DESCRIPCION?: string;
  PLAZO?: number;
  DIAS_ENTREGA?: number;
  TIPO_CONDICION?: string;
  VALOR?: number;
}

export interface Ven209Lookup {
  ID_LEGAL?: number | string;
  NOMBRE_COMPLETO?: string;
  ID_GRUPO?: string;
  ID_GRUPO_PADRE?: string;
  NOMBRE?: string;
  TIPO?: string;
  PERSONA?: string;
  ID_ADC?: string;
  ID_UBICACION?: string;
  STATUS?: string;
  ID_RT?: string;
  DESCRIPCION?: string;
  CODIGO?: string;
  ID_CONDICION?: string;
  PLAZO?: number;
  [key: string]: unknown;
}

export interface Ven209ClienteRecord {
  ID_UN?: string | null;
  ID_CLIENTE?: string | null;
  ID_LEGAL?: number | string | null;
  ID_CLIENTE_PADRE?: string | null;
  PERFIL_TRIBUTARIO?: string | null;
  PERFIL_TASAS?: Array<{ ID_TASA: string; APLICA_BASE: boolean }> | null;
  CLASE?: string | null;
  ID_GRUPO?: string | null;
  COMENTARIOS?: string | null;
  CONTACTO?: string | null;
  REPRESENTANTE_LEGAL?: string | null;
  ZONA?: string | null;
  ID_ADC?: string | null;
  STATUS?: string | null;
  CUPO_CREDITO?: number | null;
  CUPO_DISPONIBLE?: number | null;
  FRECUENCIA?: number | null;
  ESTADO?: string | null;
  CUPO_CUOTA?: number | null;
  CUPO_DIS_CUOTA?: number | null;
  ESTADO_CUPO?: string | null;
  ESTADO_CUOTA?: string | null;
  DESCRIPCION_CUPO?: string | null;
  NOMBRE_COMPLETO?: string | null;
  APELLIDO_COMPLETO?: string | null;
  NOMBRE?: string | null;
  NOMBRE2?: string | null;
  APELLIDO?: string | null;
  APELLIDO2?: string | null;
  TIPO_ID?: string | null;
  PERSONA?: string | null;
  FECHA_REGISTRO?: string | null;
  TIEMPO_ENTREGA?: number | null;
  DIRECCIONES?: Ven209Direccion[];
  TELEFONOS?: Ven209Telefono[];
  ITM_EMAIL?: Ven209Email[];
  ADIC_ACREEDORES?: Ven209ContactoAdicional | null;
  CONDICIONES?: Ven209Condicion[];
  CONDICIONES_ADIC?: unknown;
  CLIENTES_PRO?: unknown[];
  BANCOS?: unknown[];
  RT?: string[] | string | null;
  QFILTRO?: string | null;
  ErrMensaje?: string | null;
}
