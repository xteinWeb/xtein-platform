import { Cal001ForbiddenFields, Cal001ForbiddenPrefix, Cal001Origen } from '../constants/cal-001.constants';
import type { Cal001Borrador, Cal001RegistroCompleto } from '../models/cal-001.model';
import { claveParte } from './cal-001-modelo';
import { partesConCausas } from './cal-001-validaciones';

const texto = (valor: string | null | undefined): string | null => {
  const limpio = String(valor ?? '').trim();
  return limpio ? limpio : null;
};

/** GUID de una operación de escritura (contrato §2.5). */
export function nuevoIdOperacion(): string {
  return crypto.randomUUID();
}

/**
 * ID_OPERACION de la escritura en curso (contrato §2.5): se genera una vez por operación y se reutiliza en los
 * reintentos de esa misma operación (misma acción y mismo contenido). Tras un éxito, o si cambia el contenido,
 * el siguiente envío lleva un ID nuevo.
 */
export class Cal001OperacionPendiente {
  private clave = '';
  private id = '';

  /** ID para enviar `accion` con `contenido`; igual al anterior si es un reintento de lo mismo sin éxito. */
  para(accion: string, contenido: unknown): string {
    const clave = `${accion}|${JSON.stringify(contenido)}`;
    if (!this.id || clave !== this.clave) {
      this.clave = clave;
      this.id = nuevoIdOperacion();
    }
    return this.id;
  }

  /** La operación se aplicó (también con REPETIDA: 1): la próxima escritura es otra operación. */
  confirmar(): void {
    this.clave = '';
    this.id = '';
  }
}

/**
 * Arma el prmDatos de `new` o `update` con las claves exactas del contrato (§2.3).
 * - Solo viajan las partes con no conformidades; el SP numera ITEM por el orden del arreglo.
 * - Las causas nunca llevan OCURRENCIAS (ajuste 2): las ocurrencias van solo en el operario.
 * - En Producción los datos de cliente van en null (E20).
 * - FECHA_EVENTO es opcional (fase 2): vacía se omite y el SP pone hoy (`new`) o conserva la actual (`update`).
 * - Siempre lleva ID_OPERACION (§2.5).
 * - Nunca incluye identidad ni permisos (USUARIO, ID_UN, ES_GESTOR, PUEDE_*, RUTA, MIME): los pone el back.
 */
export function construirPayload(borrador: Cal001Borrador, accion: 'new' | 'update', idOperacion: string): Record<string, unknown> {
  const cliente = borrador.ORIGEN === Cal001Origen.Cliente;
  const esNuevo = accion === 'new';
  const fechaEvento = texto(borrador.FECHA_EVENTO);
  const registro = {
    ORIGEN: borrador.ORIGEN,
    PRODUCTO: borrador.PRODUCTO,
    CANTIDAD_REFERENCIA: borrador.CANTIDAD_REFERENCIA,
    ...(fechaEvento ? { FECHA_EVENTO: fechaEvento } : {}),
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
  if (esNuevo) return { ID_OPERACION: idOperacion, REGISTRO: registro, PARTES: partes };
  return {
    ID_REGISTRO_NC: borrador.ID_REGISTRO_NC,
    VERSION: borrador.VERSION,
    ID_OPERACION: idOperacion,
    MOTIVO: texto(borrador.MOTIVO),
    REGISTRO: registro,
    PARTES: partes
  };
}

export interface Cal001OperarioAgregar { ID_EMPLEADO: string; OCURRENCIAS: number; ID_SECCION?: string | null }
export interface Cal001CausaAgregar { ID_CAUSA: string; OPERARIOS: Cal001OperarioAgregar[] }
export interface Cal001ParteAgregar { ID_PARTE: string | null; ITEM_PRODUCTO_PARTE: number | null; PIEZA?: string | null; CAUSAS: Cal001CausaAgregar[] }
export interface Cal001PayloadAgregar { ID_REGISTRO_NC: number; VERSION: number; ID_OPERACION: string; PARTES: Cal001ParteAgregar[] }

/** Ocurrencias adicionales válidas (entero ≥ 1) de un operario ya guardado; 0 si no hay. */
function adicionales(valor: number | null | undefined): number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 ? valor : 0;
}

/**
 * prmDatos de `agregar` (contrato §2.3, "Acción agregar"): SOLO lo nuevo respecto del registro guardado.
 * Compara por claves naturales (parte por ID_PARTE + ITEM, causa por ID_CAUSA, operario por ID_EMPLEADO):
 * partes nuevas, causas nuevas en partes guardadas, operarios nuevos en causas guardadas y ocurrencias
 * adicionales (ADICIONALES) de operarios guardados, que el SP suma. Nunca lleva ID_*_NC, REGISTRO ni MOTIVO,
 * y por construcción no puede quitar ni bajar nada. `PARTES` vacío = no se agregó nada.
 */
export function payloadAgregar(borrador: Cal001Borrador, original: Cal001RegistroCompleto, idOperacion: string): Cal001PayloadAgregar {
  const partes: Cal001ParteAgregar[] = [];
  for (const parte of partesConCausas(borrador)) {
    const guardada = original.PARTES.find(p => claveParte(p.ID_PARTE, p.ITEM_PRODUCTO_PARTE) === parte.CLAVE);
    const causas: Cal001CausaAgregar[] = [];
    for (const causa of parte.CAUSAS) {
      if (!causa.ID_CAUSA) continue;
      const causaGuardada = guardada?.CAUSAS.find(c => c.ID_CAUSA === causa.ID_CAUSA);
      const operarios: Cal001OperarioAgregar[] = [];
      for (const operario of causa.OPERARIOS) {
        const existe = causaGuardada?.OPERARIOS.some(o => o.ID_EMPLEADO === operario.ID_EMPLEADO);
        if (!existe) {
          operarios.push({ ID_EMPLEADO: operario.ID_EMPLEADO, OCURRENCIAS: operario.OCURRENCIAS ?? 0, ID_SECCION: operario.ID_SECCION });
        } else if (adicionales(operario.ADICIONALES)) {
          operarios.push({ ID_EMPLEADO: operario.ID_EMPLEADO, OCURRENCIAS: adicionales(operario.ADICIONALES) });
        }
      }
      // Una causa nueva va aunque no traiga operarios (origen Cliente); una guardada, solo si suma algo.
      if (!causaGuardada || operarios.length) causas.push({ ID_CAUSA: causa.ID_CAUSA, OPERARIOS: operarios });
    }
    if (!causas.length) continue;
    const nueva: Cal001ParteAgregar = { ID_PARTE: parte.ID_PARTE, ITEM_PRODUCTO_PARTE: parte.ID_PARTE ? parte.ITEM_PRODUCTO_PARTE : null, CAUSAS: causas };
    // "Producto completo" se reconoce por la pieza; una parte nueva lleva la suya. Una parte guardada con PA no la cambia.
    if (!guardada || !parte.ID_PARTE) nueva.PIEZA = texto(guardada ? guardada.PIEZA : parte.PIEZA);
    partes.push(nueva);
  }
  return { ID_REGISTRO_NC: original.REGISTRO.ID_REGISTRO_NC, VERSION: original.REGISTRO.VERSION, ID_OPERACION: idOperacion, PARTES: partes };
}

/** true si el borrador en modo Agregar trae algo nuevo respecto del registro guardado. */
export function hayAlgoQueAgregar(borrador: Cal001Borrador, original: Cal001RegistroCompleto): boolean {
  return payloadAgregar(borrador, original, '').PARTES.length > 0;
}

/** prmDatos de `foto agregar` por /foto-subir (el controlador arma el DATA_JSON del SP, §2.4 y §6.2). */
export function payloadFoto(idRegistro: number, nombre: string, base64: string, idOperacion: string): Record<string, unknown> {
  return { ID_REGISTRO_NC: idRegistro, NOMBRE_ORIGINAL: nombre, BASE64: base64, ID_OPERACION: idOperacion };
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
