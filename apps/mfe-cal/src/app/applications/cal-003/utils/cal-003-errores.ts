/** Error de negocio devuelto por el SP o por el controlador (`ErrMensaje`). */
export class Cal003BackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Cal003BackendError';
  }
}

interface ErrorHttp {
  status: number;
  error?: unknown;
}

function esErrorHttp(error: unknown): error is ErrorHttp {
  return !!error && typeof error === 'object' && typeof (error as ErrorHttp).status === 'number' && 'error' in error;
}

/** ErrMensaje del cuerpo de un rechazo del controlador: `{ data: "[{ErrMensaje}]", error }`. */
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

function mensajeHttp(status: number, cuerpo: string): string {
  switch (status) {
    case 0: return 'No hay conexión con el servidor. Revise la red e intente de nuevo.';
    case 400: return cuerpo ? `Petición rechazada: ${cuerpo}` : 'El servidor rechazó la petición.';
    case 401: return 'La sesión expiró. Vuelva a iniciar sesión.';
    case 404: return 'El archivo del soporte no se encontró en el servidor.';
    case 413: return 'El soporte supera el tamaño máximo de 3 MB.';
    case 415: return 'Formato no permitido. Use PDF, JPG o PNG.';
    case 503: return 'El servicio de Servicios técnicos no está disponible en este momento. Intente más tarde.';
    default: return cuerpo && status < 500 ? cuerpo : `Error del servidor (${status}). Intente de nuevo; si persiste, avise a soporte.`;
  }
}

function mensajeNegocio(texto: string): string {
  if (texto.startsWith('Modificado por')) return `${texto.replace(/; recargue$/, '')}. Refresque para ver la versión vigente.`;
  if (texto.startsWith('Sin acceso a CAL-003')) return 'No tiene acceso a CAL-003. Pida al administrador el permiso en ADM015.';
  if (texto.startsWith('Recurso ocupado')) return 'Otro usuario está guardando en este momento. Intente de nuevo en unos segundos.';
  return texto;
}

/** Mensaje para el usuario a partir de cualquier error (ErrMensaje del SP, HTTP 4xx/5xx o excepción). */
export function mensajeError(error: unknown): string {
  if (error instanceof Cal003BackendError) return mensajeNegocio(error.message);
  if (esErrorHttp(error)) {
    const cuerpo = mensajeCuerpo(error.error);
    if (error.status === 200 && cuerpo) return mensajeNegocio(cuerpo);
    return mensajeHttp(error.status, cuerpo);
  }
  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo completar la operación.';
}

/**
 * Decodifica `{ data, token }` (data como cadena JSON, a veces doblemente codificada)
 * y lanza Cal003BackendError si alguna fila trae ErrMensaje.
 */
export function decodificar<T>(respuesta: unknown): T[] {
  let datos = respuesta;
  for (let nivel = 0; nivel < 4; nivel++) {
    if (typeof datos === 'string') {
      const texto = datos;
      try {
        datos = JSON.parse(texto);
      } catch (error) {
        console.error('CAL-003: respuesta del servidor que no es JSON.', { error, inicio: texto.slice(0, 200) });
        throw new Cal003BackendError('La respuesta del servidor no es válida. Intente de nuevo; si persiste, avise a soporte.');
      }
      continue;
    }
    if (datos && typeof datos === 'object' && !Array.isArray(datos) && 'data' in datos) { datos = (datos as { data: unknown }).data; continue; }
    break;
  }
  const filas = Array.isArray(datos) ? datos : datos == null ? [] : [datos];
  const error = filas.find(fila => fila && typeof fila === 'object' && (fila as { ErrMensaje?: string }).ErrMensaje);
  if (error) throw new Cal003BackendError(String((error as { ErrMensaje: string }).ErrMensaje));
  return filas as T[];
}
