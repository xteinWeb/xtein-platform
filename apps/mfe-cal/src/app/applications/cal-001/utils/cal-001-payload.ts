import { Cal001ForbiddenFields, Cal001ForbiddenPrefix, Cal001Origen } from '../constants/cal-001.constants';
import type { Cal001Borrador } from '../models/cal-001.model';
import { partesConCausas } from './cal-001-validaciones';

const texto = (valor: string | null | undefined): string | null => {
  const limpio = String(valor ?? '').trim();
  return limpio ? limpio : null;
};

/**
 * Arma el prmDatos de `new` o `update` con las claves exactas del contrato (§2.3).
 * - Solo viajan las partes con no conformidades; el SP numera ITEM por el orden del arreglo.
 * - Las causas nunca llevan OCURRENCIAS (ajuste 2): las ocurrencias van solo en el operario.
 * - En Producción los datos de cliente van en null (E20).
 * - Nunca incluye identidad ni permisos (USUARIO, ID_UN, ES_GESTOR, PUEDE_*, RUTA, MIME): los pone el back.
 */
export function construirPayload(borrador: Cal001Borrador, accion: 'new' | 'update'): Record<string, unknown> {
  const cliente = borrador.ORIGEN === Cal001Origen.Cliente;
  const esNuevo = accion === 'new';
  const registro = {
    ORIGEN: borrador.ORIGEN,
    PRODUCTO: borrador.PRODUCTO,
    CANTIDAD_REFERENCIA: borrador.CANTIDAD_REFERENCIA,
    FECHA_EVENTO: borrador.FECHA_EVENTO,
    OBSERVACION: texto(borrador.OBSERVACION),
    ID_CLIENTE: cliente ? texto(borrador.ID_CLIENTE) : null,
    N_SERVICIO: cliente ? texto(borrador.N_SERVICIO) : null,
    ID_AREA_DETECCION: cliente ? texto(borrador.ID_AREA_DETECCION) : null,
    FUENTE: cliente ? texto(borrador.FUENTE) : null,
    FECHA_RECLAMO: cliente ? texto(borrador.FECHA_RECLAMO) : null,
    ID_CAUSA_CLIENTE: cliente ? texto(borrador.ID_CAUSA_CLIENTE) : null
  };
  const partes = partesConCausas(borrador).map(parte => ({
    ID_PARTE_NC: esNuevo ? null : parte.ID_PARTE_NC,
    ID_PARTE: parte.ID_PARTE,
    ITEM_PRODUCTO_PARTE: parte.ID_PARTE ? parte.ITEM_PRODUCTO_PARTE : null,
    PIEZA: texto(parte.PIEZA),
    CAUSAS: parte.CAUSAS.map(causa => ({
      ID_CAUSA_NC: esNuevo ? null : causa.ID_CAUSA_NC,
      ID_CAUSA: causa.ID_CAUSA,
      OPERARIOS: causa.OPERARIOS.map(operario => ({
        ID_OPERARIO_NC: esNuevo ? null : operario.ID_OPERARIO_NC,
        ID_EMPLEADO: operario.ID_EMPLEADO,
        OCURRENCIAS: operario.OCURRENCIAS,
        ID_SECCION: operario.ID_SECCION
      }))
    }))
  }));
  if (esNuevo) return { REGISTRO: registro, PARTES: partes };
  return {
    ID_REGISTRO_NC: borrador.ID_REGISTRO_NC,
    VERSION: borrador.VERSION,
    MOTIVO: texto(borrador.MOTIVO),
    REGISTRO: registro,
    PARTES: partes
  };
}

/** Claves prohibidas presentes a cualquier profundidad (el back respondería 400). Vacío = correcto. */
export function camposProhibidos(valor: unknown): string[] {
  const encontrados = new Set<string>();
  const recorrer = (nodo: unknown): void => {
    if (Array.isArray(nodo)) { nodo.forEach(recorrer); return; }
    if (!nodo || typeof nodo !== 'object') return;
    for (const [clave, hijo] of Object.entries(nodo)) {
      const mayuscula = clave.toUpperCase();
      if (Cal001ForbiddenFields.includes(mayuscula) || mayuscula.startsWith(Cal001ForbiddenPrefix)) encontrados.add(clave);
      recorrer(hijo);
    }
  };
  recorrer(valor);
  return [...encontrados];
}
