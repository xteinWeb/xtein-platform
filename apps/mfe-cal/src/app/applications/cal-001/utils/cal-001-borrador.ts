import { filter, type Observable, type Subscription } from 'rxjs';
import type { Cal001Borrador } from '../models/cal-001.model';

/** Prefijo de las claves de borrador; la clave completa es `cal001-borrador:<empresa>:<usuario>`. */
export const PrefijoBorrador = 'cal001-borrador:';

export interface Cal001BorradorGuardado {
  /** Clave (empresa y usuario) con la que se guardó; si no coincide con la de la sesión se descarta. */
  CLAVE: string;
  GUARDADO_EN: string;
  BORRADOR: Cal001Borrador;
}

/** Almacenamiento mínimo (localStorage o un sustituto en pruebas). */
export type AlmacenBorrador = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function almacenPorDefecto(): AlmacenBorrador | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function claveBorrador(empresa: string, usuario: string): string | null {
  if (!empresa || !usuario) return null;
  return `${PrefijoBorrador}${empresa}:${usuario.toUpperCase()}`;
}

/**
 * Borrador local del registro nuevo, por empresa y usuario (plan C15). Toda lectura y escritura va en
 * try/catch: sin almacenamiento (modo privado, cuota llena) la captura sigue funcionando, solo sin borrador.
 */
export class Cal001AlmacenBorrador {
  constructor(private readonly almacen: AlmacenBorrador | null = almacenPorDefecto()) {}

  leer(clave: string | null): Cal001BorradorGuardado | null {
    if (!clave || !this.almacen) return null;
    try {
      const texto = this.almacen.getItem(clave);
      if (!texto) return null;
      const valor = JSON.parse(texto) as Cal001BorradorGuardado;
      if (valor && typeof valor === 'object' && valor.CLAVE === clave && valor.BORRADOR && Array.isArray(valor.BORRADOR.PARTES)) return valor;
    } catch {
      // Contenido ilegible: se descarta abajo.
    }
    // Borrador de otro usuario o empresa, o dañado: no se ofrece y se borra.
    this.borrar(clave);
    return null;
  }

  guardar(clave: string | null, borrador: Cal001Borrador, ahora: Date = new Date()): boolean {
    if (!clave || !this.almacen) return false;
    try {
      const valor: Cal001BorradorGuardado = { CLAVE: clave, GUARDADO_EN: ahora.toISOString(), BORRADOR: borrador };
      this.almacen.setItem(clave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  }

  borrar(clave: string | null): void {
    if (!clave || !this.almacen) return;
    try {
      this.almacen.removeItem(clave);
    } catch {
      // Sin acceso al almacenamiento no hay borrador que borrar.
    }
  }

  /**
   * Borra los borradores de CAL-001 que no son de `claveVigente` (otro usuario u otra empresa en este navegador,
   * o una sesión que se cerró sin que la aplicación estuviera abierta). Con `null` borra todos (cierre de sesión).
   */
  borrarAjenos(claveVigente: string | null): void {
    if (!this.almacen) return;
    try {
      const claves: string[] = [];
      for (let i = 0; i < this.almacen.length; i++) {
        const clave = this.almacen.key(i);
        if (clave && clave.startsWith(PrefijoBorrador) && clave !== claveVigente) claves.push(clave);
      }
      claves.forEach(clave => this.almacen?.removeItem(clave));
    } catch {
      // Sin acceso al almacenamiento no hay borradores que limpiar.
    }
  }
}

interface Cal001FuenteSesion {
  readonly updates: Observable<{ type: string }>;
}

let vigilando = false;

/**
 * Borra los borradores de CAL-001 cuando la sesión se cierra (evento `logout` de SessionService, libs/session).
 * Se registra una sola vez por página, al cargar el microfrontend por primera vez, y sigue activo aunque se
 * cierre la pestaña de CAL-001. Limitación: si en esa página nunca se abrió CAL-001, el borrador no se borra al
 * cerrar sesión; se borra la próxima vez que CAL-001 se abra con otro usuario (borrarAjenos) o al guardar/cancelar.
 */
export function vigilarCierreSesion(sesion: Cal001FuenteSesion, almacen: Cal001AlmacenBorrador = new Cal001AlmacenBorrador()): Subscription | null {
  if (vigilando) return null;
  vigilando = true;
  return sesion.updates.pipe(filter(evento => evento.type === 'logout')).subscribe(() => almacen.borrarAjenos(null));
}
