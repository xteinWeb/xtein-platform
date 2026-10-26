/** Error de negocio devuelto por el SP o por el controlador (`ErrMensaje`). */
export class Cal001BackendError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = 'Cal001BackendError';
  }
}

export interface Cal001MensajeError {
  mensaje: string;
  /** E22: otro usuario guardó una versión más nueva del registro. */
  conflictoVersion: boolean;
}

interface ErrorHttp {
  status: number;
  error?: unknown;
}

function esErrorHttp(error: unknown): error is ErrorHttp {
  return !!error && typeof error === 'object' && typeof (error as ErrorHttp).status === 'number' && 'error' in error;
}

/** Extrae el ErrMensaje del cuerpo de un rechazo del controlador: `{ data: "[{ErrMensaje}]", error }`. */
function mensajeCuerpo(cuerpo: unknown): string {
  if (!cuerpo || typeof cuerpo !== 'object') return typeof cuerpo === 'string' && !cuerpo.startsWith('<') ? cuerpo : '';
  const datos = (cuerpo as { data?: unknown }).data;
  if (typeof datos === 'string') {
    try {
      const filas = JSON.parse(datos) as { ErrMensaje?: string }[];
      const mensaje = Array.isArray(filas) ? filas.find(f => f?.ErrMensaje)?.ErrMensaje : '';
      if (mensaje) return mensaje;
    } catch {
      // El cuerpo no trae el arreglo del SP: se usa `error`.
    }
  }
  const texto = (cuerpo as { error?: unknown }).error;
  return typeof texto === 'string' ? texto : '';
}

/** Textos legibles para los códigos HTTP que devuelve /api/CAL001N (contrato §6). */
function mensajeHttp(status: number, cuerpo: string): string {
  switch (status) {
    case 0: return 'No hay conexión con el servidor. Revise la red e intente de nuevo; el borrador del registro nuevo se conserva en este equipo.';
    case 400: return cuerpo ? `Petición rechazada: ${cuerpo}` : 'El servidor rechazó la petición.';
    case 401: return 'La sesión expiró. Vuelva a iniciar sesión.';
    case 404: return 'El archivo de la foto no se encontró en el servidor.';
    case 413: return 'La foto supera el tamaño máximo de 3 MB.';
    case 415: return 'Formato de foto no permitido. Use JPG, PNG o WEBP.';
    case 429: return 'Hay demasiadas fotos subiéndose al mismo tiempo. Espere unos segundos e intente de nuevo.';
    case 503: return 'El servicio de No Conformidades no está disponible en este momento. Intente más tarde.';
    default: return cuerpo && status < 500 ? cuerpo : `Error del servidor (${status}). Intente de nuevo; si persiste, avise a soporte.`;
  }
}

/** Ajusta los textos del SP (catálogo E00-E99) que necesitan una indicación al usuario. */
function mensajeNegocio(texto: string): Cal001MensajeError {
  if (texto.startsWith('Modificado por')) {
    return {
      mensaje: `${texto.replace(/; recargue$/, '')}. Su cambio no se guardó: recargue el registro para ver la versión vigente y vuelva a aplicar la corrección.`,
      conflictoVersion: true
    };
  }
  if (texto.startsWith('Error interno')) {
    return { mensaje: `${texto}. Intente de nuevo; si persiste, avise a soporte con este número.`, conflictoVersion: false };
  }
  if (texto.startsWith('Sin acceso a CAL-001')) {
    return { mensaje: 'No tiene acceso a CAL-001. Pida al administrador el permiso en ADM015.', conflictoVersion: false };
  }
  if (texto.startsWith('Recurso ocupado')) {
    return { mensaje: 'Otro usuario está guardando en este momento. Intente de nuevo en unos segundos.', conflictoVersion: false };
  }
  return { mensaje: texto, conflictoVersion: false };
}

/** Mensaje para el usuario a partir de cualquier error (E-códigos del SP, HTTP 4xx/5xx o excepción). */
export function mensajeError(error: unknown): Cal001MensajeError {
  if (error instanceof Cal001BackendError) return mensajeNegocio(error.message);
  if (esErrorHttp(error)) {
    const cuerpo = mensajeCuerpo(error.error);
    if (error.status === 200 && cuerpo) return mensajeNegocio(cuerpo);
    return { mensaje: mensajeHttp(error.status, cuerpo), conflictoVersion: false };
  }
  if (error instanceof Error && error.message) return { mensaje: error.message, conflictoVersion: false };
  return { mensaje: 'No se pudo completar la operación.', conflictoVersion: false };
}

/**
 * Decodifica la respuesta `{ data, token }` (data como cadena JSON, a veces doblemente codificada)
 * y lanza Cal001BackendError si alguna fila trae ErrMensaje.
 */
export function decodificar<T>(respuesta: unknown): T[] {
  let datos = respuesta;
  for (let nivel = 0; nivel < 4; nivel++) {
    if (typeof datos === 'string') {
      const texto = datos;
      try {
        datos = JSON.parse(texto);
      } catch (error) {
        // El detalle va a la consola del navegador; al usuario, un mensaje genérico.
        console.error('CAL-001: respuesta del servidor que no es JSON.', { error, inicio: texto.slice(0, 200) });
        throw new Cal001BackendError('La respuesta del servidor no es válida. Intente de nuevo; si persiste, avise a soporte.');
      }
      continue;
    }
    if (datos && typeof datos === 'object' && !Array.isArray(datos) && 'data' in datos) { datos = (datos as { data: unknown }).data; continue; }
    break;
  }
  const filas = Array.isArray(datos) ? datos : datos == null ? [] : [datos];
  const error = filas.find(fila => fila && typeof fila === 'object' && (fila as { ErrMensaje?: string }).ErrMensaje);
  if (error) throw new Cal001BackendError(String((error as { ErrMensaje: string }).ErrMensaje));
  return filas as T[];
}
