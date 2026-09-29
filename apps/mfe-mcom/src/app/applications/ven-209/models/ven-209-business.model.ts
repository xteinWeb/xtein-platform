import {
  Ven209ClienteRecord,
  Ven209ContactoAdicional,
  Ven209Direccion,
  Ven209Email,
  Ven209Telefono,
  Ven209Condicion
} from './ven-209.model';

export interface Ven209SavePayload {
  ACREEDOR: Ven209ClienteRecord;
  ADIC_ACREEDORES?: Ven209ContactoAdicional;
  EMAIL?: Ven209Email[];
  DIRECCIONES?: Ven209Direccion[];
  TELEFONOS?: Ven209Telefono[];
  CONDICIONES?: Ven209Condicion[] | { CONDICIONES?: Ven209Condicion[]; ADICIONALES?: unknown };
  CLIENTES_EVAL?: unknown[];
  BANCOS?: unknown[];
  USUARIO?: string;
  FECHA_REGISTRO?: string | Date;
}

export interface Ven209DeletePayload {
  CLIENTES: {
    ID_CLIENTE: string;
  };
  USUARIO?: string;
}

export interface Ven209FilterCriteria {
  ESTRUCTURA?: unknown[];
  [key: string]: unknown;
}
