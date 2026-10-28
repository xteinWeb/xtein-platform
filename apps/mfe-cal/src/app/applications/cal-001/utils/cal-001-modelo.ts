import { Cal001Origen } from '../constants/cal-001.constants';
import type {
  Cal001Borrador,
  Cal001Operario,
  Cal001OperarioBorrador,
  Cal001ParteBorrador,
  Cal001PartesProducto,
  Cal001RegistroCompleto,
  Cal001RegistroParte
} from '../models/cal-001.model';

/** Clave de la fila "Producto completo" (PF sin partes, DP-4). */
export const ClaveProductoCompleto = 'COMPLETO';

export function claveParte(idParte: string | null, item: number | null): string {
  return idParte ? `${idParte}|${item ?? ''}` : ClaveProductoCompleto;
}

/** Registro nuevo: origen Producción, fecha del evento = hoy (editable, ajuste 1). */
export function borradorVacio(hoy: string): Cal001Borrador {
  return {
    ID_REGISTRO_NC: null, VERSION: null, DOCUMENTO: '', ORIGEN: Cal001Origen.Produccion,
    PRODUCTO: '', NOMBRE_PRODUCTO: '', SIN_PARTES: false, CANTIDAD_REFERENCIA: null,
    FECHA_EVENTO: hoy, OBSERVACION: '', ID_CLIENTE: '', NOMBRE_CLIENTE: '', N_SERVICIO: '',
    ID_AREA_DETECCION: '', FUENTE: '', FECHA_RECLAMO: '', ID_CAUSA_CLIENTE: '', MOTIVO: '', PARTES: []
  };
}

function parteVacia(idParte: string | null, item: number | null, nombre: string): Cal001ParteBorrador {
  return { CLAVE: claveParte(idParte, item), ID_PARTE_NC: null, ID_PARTE: idParte, ITEM_PRODUCTO_PARTE: item,
    NOMBRE_PARTE: nombre, PIEZA: '', CAUSAS: [] };
}

/** Grilla de partes del PF (historia 2); sin partes → una sola fila "Producto completo". */
export function partesDesdeProducto(partes: Cal001PartesProducto): Cal001ParteBorrador[] {
  if (Number(partes.SIN_PARTES) === 1 || !partes.PARTES.length) return [parteVacia(null, null, 'Producto completo')];
  return partes.PARTES.map(parte => parteVacia(parte.ID_PARTE, parte.ITEM_PRODUCTO_PARTE, parte.NOMBRE));
}

function parteDesdeRegistro(parte: Cal001RegistroParte): Cal001ParteBorrador {
  return {
    CLAVE: claveParte(parte.ID_PARTE, parte.ITEM_PRODUCTO_PARTE),
    ID_PARTE_NC: parte.ID_PARTE_NC,
    ID_PARTE: parte.ID_PARTE,
    ITEM_PRODUCTO_PARTE: parte.ITEM_PRODUCTO_PARTE,
    NOMBRE_PARTE: parte.ID_PARTE ? (parte.NOMBRE_PARTE ?? '') : 'Producto completo',
    PIEZA: parte.PIEZA ?? '',
    CAUSAS: parte.CAUSAS.map(causa => ({
      ID_CAUSA_NC: causa.ID_CAUSA_NC, ID_CAUSA: causa.ID_CAUSA, NOMBRE: causa.NOMBRE, DESCRIPCION: causa.DESCRIPCION,
      OPERARIOS: causa.OPERARIOS.map(operario => ({
        ID_OPERARIO_NC: operario.ID_OPERARIO_NC, ID_EMPLEADO: operario.ID_EMPLEADO, NOMBRE: operario.NOMBRE,
        OCURRENCIAS: operario.OCURRENCIAS, ID_SECCION: operario.ID_SECCION,
        DESCRIPCION_SECCION: operario.DESCRIPCION_SECCION ?? '', SECCIONES: []
      }))
    }))
  };
}

/**
 * Borrador a partir de un registro guardado. Si se conocen las partes actuales del PF, la grilla las muestra
 * todas (con lo guardado encima) y conserva al final las guardadas que ya no estén activas en el PF.
 */
export function borradorDesdeRegistro(registro: Cal001RegistroCompleto, partesProducto: Cal001PartesProducto | null): Cal001Borrador {
  const r = registro.REGISTRO;
  const guardadas = registro.PARTES.map(parteDesdeRegistro);
  let partes = guardadas;
  if (partesProducto) {
    const base = partesDesdeProducto(partesProducto);
    const usadas = new Set<string>();
    partes = base.map(parte => {
      const guardada = guardadas.find(g => g.CLAVE === parte.CLAVE);
      if (!guardada) return parte;
      usadas.add(guardada.CLAVE);
      return { ...guardada, NOMBRE_PARTE: guardada.NOMBRE_PARTE || parte.NOMBRE_PARTE };
    });
    partes.push(...guardadas.filter(g => !usadas.has(g.CLAVE)));
  }
  return {
    ID_REGISTRO_NC: r.ID_REGISTRO_NC, VERSION: r.VERSION, DOCUMENTO: r.DOCUMENTO, ORIGEN: r.ORIGEN,
    PRODUCTO: r.PRODUCTO, NOMBRE_PRODUCTO: r.NOMBRE_PRODUCTO ?? '',
    SIN_PARTES: partes.length === 1 && partes[0].ID_PARTE === null,
    CANTIDAD_REFERENCIA: r.CANTIDAD_REFERENCIA, FECHA_EVENTO: (r.FECHA_EVENTO ?? '').substring(0, 10),
    OBSERVACION: r.OBSERVACION ?? '', ID_CLIENTE: r.ID_CLIENTE ?? '', NOMBRE_CLIENTE: r.NOMBRE_CLIENTE ?? '',
    N_SERVICIO: r.N_SERVICIO ?? '', ID_AREA_DETECCION: r.ID_AREA_DETECCION ?? '', FUENTE: r.FUENTE ?? '',
    FECHA_RECLAMO: (r.FECHA_RECLAMO ?? '').substring(0, 10), ID_CAUSA_CLIENTE: r.ID_CAUSA_CLIENTE ?? '',
    MOTIVO: '', PARTES: partes
  };
}

/** Operario recién agregado: el proceso se llena solo con su sección principal (historia 4). */
export function operarioDesdeMaestro(operario: Cal001Operario): Cal001OperarioBorrador {
  const sugerida = operario.ID_SECCION_SUGERIDA
    ?? (operario.SECCIONES.length === 1 ? operario.SECCIONES[0].ID_SECCION : null);
  const seccion = operario.SECCIONES.find(s => s.ID_SECCION === sugerida);
  return {
    ID_OPERARIO_NC: null, ID_EMPLEADO: operario.ID_EMPLEADO, NOMBRE: operario.NOMBRE, OCURRENCIAS: 1,
    ID_SECCION: seccion ? seccion.ID_SECCION : null, DESCRIPCION_SECCION: seccion?.DESCRIPCION ?? '',
    SECCIONES: operario.SECCIONES
  };
}

/** true si el borrador ya tiene datos de captura (para confirmar antes de cambiar el PF). */
export function tieneCaptura(borrador: Cal001Borrador): boolean {
  return borrador.PARTES.some(parte => parte.CAUSAS.length > 0 || parte.PIEZA.trim() !== '');
}

/** Copia profunda del borrador (los datos son JSON plano). */
export function clonarBorrador(borrador: Cal001Borrador): Cal001Borrador {
  return JSON.parse(JSON.stringify(borrador)) as Cal001Borrador;
}

/** "Registrado por" (fase 2): nombre · área; sin nombre, el código del usuario. */
export function nombreConArea(nombre: string | null | undefined, area: string | null | undefined, codigo: string): string {
  const base = String(nombre ?? '').trim() || codigo;
  const seccion = String(area ?? '').trim();
  return seccion ? `${base} · ${seccion}` : base;
}
