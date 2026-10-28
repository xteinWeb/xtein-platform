import type { Cal001Origen } from '../constants/cal-001.constants';

/* =====================================================================
 * Respuestas del SP (contrato §2). Las banderas llegan como 0/1.
 * ===================================================================== */

export interface Cal001Permisos {
  PUEDE_VER: number;
  PUEDE_CREAR: number;
  ES_GESTOR: number;
}

export interface Cal001Causa {
  ID_CAUSA: string;
  NOMBRE: string;
  /** CAUSAS.DESCRIPCION (ajuste 4); el SP devuelve NOMBRE si es NULL. */
  DESCRIPCION: string;
  TIPO: 'PRODUCCION' | 'CLIENTE';
}

export interface Cal001Producto {
  PRODUCTO: string;
  NOMBRE: string;
  SIN_PARTES: number;
}

export interface Cal001ParteProducto {
  ID_PARTE: string;
  ITEM_PRODUCTO_PARTE: number;
  NOMBRE: string;
  CANTIDAD: number | null;
}

export interface Cal001PartesProducto {
  PRODUCTO: string;
  SIN_PARTES: number;
  PARTES: Cal001ParteProducto[];
}

export interface Cal001Seccion {
  ID_SECCION: string;
  DESCRIPCION: string;
  PRINCIPAL: number | boolean | string | null;
}

export interface Cal001Operario {
  ID_EMPLEADO: string;
  NOMBRE: string;
  ID_SECCION_SUGERIDA: string | null;
  SECCIONES: Cal001Seccion[];
}

export interface Cal001Cliente {
  ID_CLIENTE: string;
  NOMBRE: string;
}

export interface Cal001ValorLista {
  ITEM: number | string;
  VALOR: string;
}

export interface Cal001ListasCliente {
  AREAS_DETECCION: Cal001ValorLista[];
  FUENTES: Cal001ValorLista[];
}

export interface Cal001ConsultaFila {
  ID_REGISTRO_NC: number;
  DOCUMENTO: string;
  ORIGEN: Cal001Origen;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  FECHA_EVENTO: string;
  FECHA_REGISTRO: string;
  USUARIO_CREA: string;
  /** Nombre de quien registró (fase 2); el SP devuelve el código si no lo encuentra. */
  NOMBRE_USUARIO_CREA: string;
  /** Área padre de su sección principal (DP-D); null sin sección. */
  AREA_USUARIO_CREA: string | null;
  USUARIO_MODIFICA: string | null;
  FECHA_MODIFICA: string | null;
  VERSION: number;
  ID_CLIENTE: string | null;
  NOMBRE_CLIENTE: string | null;
  N_PARTES: number;
  N_CAUSAS: number;
  /** Nombres distintos de las causas separados por ", ", recortados a 400 con "…" (solo para la grilla). */
  CAUSAS: string | null;
  N_OPERARIOS: number;
  TOTAL_OCURRENCIAS: number;
  N_FOTOS: number;
}

export interface Cal001ConsultaResultado {
  TOTAL: number;
  PAGINA: number;
  TAMANO: number;
  FILAS: Cal001ConsultaFila[];
}

export interface Cal001ConsultaFiltro {
  FECHA_DESDE: string;
  FECHA_HASTA: string;
  ORIGEN: Cal001Origen | '';
  DOCUMENTO: string;
  /** Cédula exacta de un operario del registro; solo el gestor (DP-L). Vacío = no se envía. */
  ID_EMPLEADO: string;
  /** Fecha a la que se aplica el rango (por omisión EVENTO en el SP; no se envía si falta). */
  FECHA_BASE?: 'EVENTO' | 'REGISTRO';
}

export interface Cal001RegistroEncabezado {
  ID_REGISTRO_NC: number;
  DOCUMENTO: string;
  ORIGEN: Cal001Origen;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  CANTIDAD_REFERENCIA: number | null;
  FECHA_EVENTO: string;
  FECHA_REGISTRO: string;
  OBSERVACION: string | null;
  ID_CLIENTE: string | null;
  NOMBRE_CLIENTE: string | null;
  N_SERVICIO: string | null;
  ID_AREA_DETECCION: string | null;
  FUENTE: string | null;
  FECHA_RECLAMO: string | null;
  ID_CAUSA_CLIENTE: string | null;
  NOMBRE_CAUSA_CLIENTE: string | null;
  ESTADO: string;
  USUARIO_CREA: string;
  FECHA_CREA: string;
  USUARIO_MODIFICA: string | null;
  FECHA_MODIFICA: string | null;
  VERSION: number;
}

export interface Cal001RegistroOperario {
  ID_OPERARIO_NC: number;
  ID_EMPLEADO: string;
  NOMBRE: string;
  OCURRENCIAS: number;
  ID_SECCION: string | null;
  DESCRIPCION_SECCION: string | null;
}

export interface Cal001RegistroCausa {
  ID_CAUSA_NC: number;
  ID_CAUSA: string;
  NOMBRE: string;
  DESCRIPCION: string;
  OPERARIOS: Cal001RegistroOperario[];
}

export interface Cal001RegistroParte {
  ID_PARTE_NC: number;
  ITEM: number;
  ID_PARTE: string | null;
  ITEM_PRODUCTO_PARTE: number | null;
  NOMBRE_PARTE: string | null;
  PIEZA: string | null;
  CAUSAS: Cal001RegistroCausa[];
}

export interface Cal001Foto {
  ID_FOTO_NC: number;
  NOMBRE_ORIGINAL: string;
  MIME: string;
  USUARIO_CREA: string;
  FECHA_CREA: string;
}

export interface Cal001HistorialResumen {
  VERSION: number;
  ACCION: string;
  USUARIO: string;
  FECHA: string;
}

export interface Cal001HistorialDetalle extends Cal001HistorialResumen {
  MOTIVO: string | null;
  DATOS_ANTES: unknown;
  DATOS_DESPUES: unknown;
}

export interface Cal001RegistroCompleto {
  REGISTRO: Cal001RegistroEncabezado;
  PARTES: Cal001RegistroParte[];
  FOTOS: Cal001Foto[];
  HISTORIAL: Cal001HistorialResumen[];
  PUEDE_MODIFICAR: number;
  /** Fase 2: el creador (con CREAR) puede agregar a su registro hasta AGREGAR_HASTA. */
  PUEDE_AGREGAR: number;
  /** Fecha-hora de Colombia `yyyy-MM-ddTHH:mm:ss`. */
  AGREGAR_HASTA: string | null;
  PUEDE_AGREGAR_FOTOS: number;
  PUEDE_RETIRAR_FOTOS: number;
  NOMBRE_USUARIO_CREA: string;
  AREA_USUARIO_CREA: string | null;
}

export interface Cal001GuardarResultado {
  ID_REGISTRO_NC: number;
  DOCUMENTO: string;
  VERSION: number;
  FECHA_REGISTRO?: string;
  /** 1 = el SP ya había aplicado esta ID_OPERACION y devuelve el resultado original (se trata como éxito). */
  REPETIDA?: number;
}

/* =====================================================================
 * Borrador de captura (estado editable en el navegador).
 * Contiene todas las partes del PF; al guardar se envían solo las que
 * tienen al menos una no conformidad.
 * ===================================================================== */

export interface Cal001OperarioBorrador {
  ID_OPERARIO_NC: number | null;
  ID_EMPLEADO: string;
  NOMBRE: string;
  OCURRENCIAS: number | null;
  /** Modo Agregar: ocurrencias que se suman a un operario ya guardado (el SP las suma). */
  ADICIONALES?: number | null;
  ID_SECCION: string | null;
  DESCRIPCION_SECCION: string;
  /** Secciones activas del operario (vacío al abrir un registro guardado: se usa la guardada). */
  SECCIONES: Cal001Seccion[];
}

export interface Cal001CausaBorrador {
  ID_CAUSA_NC: number | null;
  ID_CAUSA: string;
  NOMBRE: string;
  DESCRIPCION: string;
  OPERARIOS: Cal001OperarioBorrador[];
}

export interface Cal001ParteBorrador {
  /** Clave estable en la UI: `ID_PARTE|ITEM` o `COMPLETO`. */
  CLAVE: string;
  ID_PARTE_NC: number | null;
  ID_PARTE: string | null;
  ITEM_PRODUCTO_PARTE: number | null;
  NOMBRE_PARTE: string;
  PIEZA: string;
  CAUSAS: Cal001CausaBorrador[];
}

export interface Cal001Borrador {
  ID_REGISTRO_NC: number | null;
  VERSION: number | null;
  DOCUMENTO: string;
  ORIGEN: Cal001Origen;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  SIN_PARTES: boolean;
  CANTIDAD_REFERENCIA: number | null;
  FECHA_EVENTO: string;
  OBSERVACION: string;
  ID_CLIENTE: string;
  NOMBRE_CLIENTE: string;
  N_SERVICIO: string;
  ID_AREA_DETECCION: string;
  FUENTE: string;
  FECHA_RECLAMO: string;
  ID_CAUSA_CLIENTE: string;
  MOTIVO: string;
  PARTES: Cal001ParteBorrador[];
}

/** Fila de "No conformidades por operario" (ajuste 3). */
export interface Cal001NcPorOperario {
  ID_EMPLEADO: string;
  NOMBRE: string;
  PROCESO: string;
  TOTAL: number;
  CAUSAS: { ID_CAUSA: string; NOMBRE: string; OCURRENCIAS: number }[];
}

/** Fila de la exportación de Consulta (plan §10.1): una por operario y causa. */
export interface Cal001FilaExportacion {
  DOCUMENTO: string;
  ORIGEN: string;
  FECHA_REGISTRO: string;
  FECHA_EVENTO: string;
  REGISTRADO_POR: string;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  PARTE: string;
  CAUSA: string;
  NOMBRE_CAUSA: string;
  OPERARIO: string;
  NOMBRE_OPERARIO: string;
  PROCESO: string;
  OCURRENCIAS: number | null;
}
