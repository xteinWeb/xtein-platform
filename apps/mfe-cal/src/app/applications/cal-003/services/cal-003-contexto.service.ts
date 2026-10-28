import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import Swal from 'sweetalert2';
import { RecordToolbarMode } from '@xtein/sdk';
import { XteinNotificationService } from '@xtein/ui';
import { Cal003Service } from './cal-003.service';
import type { Cal003Area, Cal003Aviso, Cal003Bodega, Cal003Cabecera, Cal003Cliente, Cal003Permisos, Cal003TipoServicio } from '../models/cal-003.model';
import { mensajeError } from '../utils/cal-003-errores';

/** Lo que cada pestaña publica en la barra de acciones de la plataforma. */
export interface Cal003EstadoBarra {
  mode: RecordToolbarMode;
  currentIndex: number;
  total: number;
}

/** Contrato entre la pantalla y cada pestaña: la barra la maneja la pantalla y le pasa la acción a la pestaña activa. */
export interface Cal003Pestana {
  readonly barra: Signal<Cal003EstadoBarra>;
  /** Documento abierto para la cabecera común (Entrada, Traslado y Salida). */
  readonly cabecera?: Signal<Cal003Cabecera | null>;
  ejecutar(accion: string, payload?: unknown): Promise<void>;
  refrescar(): Promise<void>;
}

export const Cal003BarraVacia: Cal003EstadoBarra = { mode: RecordToolbarMode.Initial, currentIndex: -1, total: 0 };

/**
 * Estado compartido de CAL-003: permisos del SP, catálogos, indicador de proceso y avisos.
 * Se provee en Cal003Component, así cada pestaña abierta tiene el suyo.
 */
@Injectable()
export class Cal003ContextoService {
  readonly api = inject(Cal003Service);
  private readonly notification = inject(XteinNotificationService);

  readonly permisos = signal<Cal003Permisos | null>(null);
  readonly bodegas = signal<Cal003Bodega[]>([]);
  readonly areas = signal<Cal003Area[]>([]);
  readonly tiposServicio = signal<Cal003TipoServicio[]>([]);
  readonly clientes = signal<Cal003Cliente[]>([]);
  readonly avisos = signal<Cal003Aviso[]>([]);
  readonly busy = signal(false);

  readonly puedeCrear = computed(() => this.permisos()?.PUEDE_CREAR === 1);
  readonly puedeAnularRecibido = computed(() => this.permisos()?.PUEDE_ANULAR_RECIBIDO === 1);
  readonly puedeAutorizar = computed(() => this.permisos()?.PUEDE_AUTORIZAR === 1);
  readonly puedePrecio = computed(() => this.permisos()?.PUEDE_PRECIO === 1);
  readonly veTodas = computed(() => this.permisos()?.VE_TODAS === 1);
  readonly misBodegas = computed(() => this.permisos()?.BODEGAS ?? []);

  /** Bodegas que el usuario ve en traslados y consultas: todas, o solo las suyas (persona de planta). */
  readonly bodegasVisibles = computed(() => this.veTodas()
    ? this.bodegas()
    : this.bodegas().filter(b => this.misBodegas().includes(b.ID_UN_BODEGA)));

  async cargar(): Promise<void> {
    const tareas: Promise<unknown>[] = [
      this.api.permisos().then(p => this.permisos.set({ ...p, BODEGAS: p.BODEGAS ?? [] })),
      this.api.bodegas().then(rows => this.bodegas.set(rows.map(b => ({ ...b, LABEL: `${b.ID_UN_BODEGA} · ${b.DESCRIPCION}` })))),
      this.api.areas().then(rows => this.areas.set(rows)),
      this.api.tiposServicio().then(rows => this.tiposServicio.set(rows.map(t => ({ ...t, LABEL: `${t.TIPO_SERVICIO} · ${t.DESCRIPCION}` })))),
      this.api.clientes().then(rows => this.clientes.set(rows.map(c => ({ ...c, LABEL: `${c.ID_CLIENTE} - ${c.NOMBRE}` }))))
    ];
    const resultados = await Promise.allSettled(tareas);
    const fallo = resultados.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (fallo) this.error(fallo.reason);
    await this.cargarAvisos();
  }

  async cargarAvisos(): Promise<void> {
    try {
      this.avisos.set(await this.api.avisos());
    } catch {
      this.avisos.set([]);
    }
  }

  bodega(id: string | null | undefined): string {
    if (!id) return '';
    return this.bodegas().find(b => b.ID_UN_BODEGA === id)?.DESCRIPCION ?? id;
  }

  /** Corre una operación con el indicador de proceso; los errores van a la notificación. */
  async ejecutar<T>(operacion: () => Promise<T>): Promise<T | null> {
    this.busy.set(true);
    try {
      return await operacion();
    } catch (error) {
      this.error(error);
      return null;
    } finally {
      this.busy.set(false);
    }
  }

  exito(mensaje: string | undefined): void {
    if (mensaje) this.notification.success(mensaje);
    void this.cargarAvisos();
  }

  /** Mensaje de éxito que no cambia avisos (p. ej. cuántos registros encontró Buscar). */
  informar(mensaje: string): void {
    this.notification.success(mensaje);
  }

  advertir(mensaje: string): void {
    this.notification.warning(mensaje);
  }

  error(error: unknown): void {
    this.notification.error(mensaje(error));
  }

  /** Observación obligatoria (anular, rechazar). Devuelve null si se cancela. */
  async pedirObservacion(titulo: string, html: string, boton: string, placeholder = 'Por qué se anula'): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      html,
      input: 'textarea',
      inputPlaceholder: placeholder,
      inputAttributes: { maxlength: '500', 'aria-label': 'Observación' },
      inputValidator: value => value?.trim() ? null : 'Escribe la observación: es obligatoria.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#0F4C81',
      confirmButtonText: boton,
      cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed ? String(result.value ?? '').trim() : null;
  }

  async confirmar(html: string, boton: string): Promise<boolean> {
    const result = await Swal.fire({
      html,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#125EDC',
      cancelButtonColor: '#0F4C81',
      confirmButtonText: boton,
      cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
  }
}

function mensaje(error: unknown): string {
  return mensajeError(error);
}
