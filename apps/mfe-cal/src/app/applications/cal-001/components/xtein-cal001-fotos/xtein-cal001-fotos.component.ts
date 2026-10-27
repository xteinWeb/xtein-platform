import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender, computed, effect, inject, input, output,
  signal, untracked, viewChild
} from '@angular/core';
import Swal from 'sweetalert2';
import { Cal001Limits } from '../../constants/cal-001.constants';
import type { Cal001Foto } from '../../models/cal-001.model';
import { Cal001Service } from '../../services/cal-001.service';
import { mensajeError } from '../../utils/cal-001-errores';
import { mostrarFecha } from '../../utils/cal-001-fecha';
import { comprimirImagen } from '../../utils/cal-001-imagen';
import { nuevoIdOperacion } from '../../utils/cal-001-payload';

export interface Cal001FotoPendiente {
  id: number;
  /** Registro al que pertenece la foto; null = registro nuevo aún sin guardar. */
  dueno: number | null;
  nombre: string;
  base64: string;
  /** ID_OPERACION de esta foto (contrato §2.5): el mismo en todos sus reintentos. */
  operacion: string;
  estado: 'pendiente' | 'subiendo' | 'error';
  mensaje: string;
}

let secuencia = 0;

/**
 * Evidencia del registro (historia 7): fotos generales, no por parte. Se comprimen en el navegador, se suben una
 * por petición en base64 por /foto-subir y se ven pidiendo el base64 a /foto (nunca con una URL directa).
 * En un registro nuevo quedan en cola y se suben después de guardar; una subida fallida se puede reintentar.
 * Cada foto en cola lleva su registro dueño: al cambiar de registro se descartan las ajenas, y nunca se sube una
 * foto a un registro distinto del suyo.
 * Fase 2 (C5): solo se agregan fotos en edición (Nuevo, Modificar o Agregar) y quedan en cola hasta Guardar
 * (`diferirSubida`); el padre las sube después de guardar y las descarta si se cancela.
 */
@Component({
  selector: 'xtein-cal001-fotos',
  standalone: true,
  templateUrl: './xtein-cal001-fotos.component.html',
  styleUrl: './xtein-cal001-fotos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001FotosComponent {
  private readonly servicio = inject(Cal001Service);
  private readonly injector = inject(Injector);
  private readonly cerrarVisor = viewChild<ElementRef<HTMLButtonElement>>('cerrarVisor');
  readonly fotos = input<readonly Cal001Foto[]>([]);
  readonly idRegistro = input<number | null>(null);
  readonly puedeAgregar = input(false);
  readonly puedeRetirar = input(false);
  /** true mientras se edita: las fotos elegidas esperan a Guardar en vez de subirse al instante. */
  readonly diferirSubida = input(false);
  /** Se emite cuando cambian las fotos guardadas, para que el registro se recargue. */
  readonly cambiaron = output<void>();
  readonly aviso = output<string>();
  /** true mientras queden fotos sin subir (la pestaña sigue marcada como sucia). */
  readonly hayPendientes = output<boolean>();

  readonly pendientes = signal<Cal001FotoPendiente[]>([]);
  readonly subiendo = signal(false);
  /** Fotos en cola del registro que se muestra (las de otro registro no se ven ni se suben). */
  readonly cola = computed(() => this.pendientes().filter(f => f.dueno === this.idRegistro()));
  readonly procesando = signal(false);
  readonly vista = signal<{ titulo: string; url: string } | null>(null);
  readonly cargandoVista = signal<number | null>(null);
  readonly fecha = mostrarFecha;
  readonly maximo = Cal001Limits.MaxPhotos;
  readonly cupo = computed(() => Cal001Limits.MaxPhotos - this.fotos().length - this.cola().length);

  constructor() {
    // Al cambiar de registro se descartan las fotos en cola de otros registros.
    effect(() => {
      const id = this.idRegistro();
      untracked(() => {
        if (this.pendientes().some(f => f.dueno !== id)) this.pendientes.update(lista => lista.filter(f => f.dueno === id));
      });
    });
    effect(() => {
      const hay = this.pendientes().length > 0;
      untracked(() => this.hayPendientes.emit(hay));
    });
  }

  /** Agrega una foto ya comprimida a la cola del registro actual. */
  encolar(nombre: string, base64: string): void {
    this.pendientes.update(lista => [...lista, {
      id: ++secuencia, dueno: this.idRegistro(), nombre, base64, operacion: nuevoIdOperacion(), estado: 'pendiente', mensaje: ''
    }]);
  }

  /**
   * Tras guardar un registro nuevo, sus fotos en cola (dueño null) pasan al registro creado.
   * Se llama antes de mostrar el registro guardado, para que no se descarten al cambiar idRegistro.
   */
  adoptar(idRegistro: number): void {
    this.pendientes.update(lista => lista.map(f => f.dueno === null ? { ...f, dueno: idRegistro } : f));
  }

  async elegirArchivos(entrada: HTMLInputElement): Promise<void> {
    const archivos = Array.from(entrada.files ?? []);
    entrada.value = '';
    if (!archivos.length) return;
    if (archivos.length > this.cupo()) {
      this.aviso.emit(`Máximo ${Cal001Limits.MaxPhotos} fotos por registro; quedan ${Math.max(0, this.cupo())}.`);
      archivos.splice(Math.max(0, this.cupo()));
    }
    this.procesando.set(true);
    try {
      for (const archivo of archivos) {
        try {
          const imagen = await comprimirImagen(archivo);
          this.encolar(imagen.nombre, imagen.base64);
        } catch (error) {
          this.aviso.emit(mensajeError(error).mensaje);
        }
      }
    } finally {
      this.procesando.set(false);
    }
    const id = this.idRegistro();
    if (id && !this.diferirSubida()) await this.subirPendientes(id);
  }

  /**
   * Sube, en orden y de a una, solo las fotos cuyo dueño es `idRegistro`; las que fallan quedan para reintentar.
   * Una sola subida a la vez: una segunda llamada mientras sube no hace nada. Devuelve cuántas subió.
   */
  async subirPendientes(idRegistro: number): Promise<number> {
    if (this.subiendo()) return 0;
    this.subiendo.set(true);
    let subidas = 0;
    const intentadas = new Set<number>();
    try {
      let lote = this.pendientes().filter(f => f.dueno === idRegistro);
      while (lote.length) {
        for (const foto of lote) {
          intentadas.add(foto.id);
          if (!this.pendientes().some(f => f.id === foto.id)) continue;
          this.marcar(foto.id, 'subiendo', '');
          try {
            await this.servicio.subirFoto(idRegistro, foto.nombre, foto.base64, foto.operacion);
            this.pendientes.update(lista => lista.filter(f => f.id !== foto.id));
            subidas++;
          } catch (error) {
            this.marcar(foto.id, 'error', mensajeError(error).mensaje);
          }
        }
        // Fotos agregadas mientras subía: se suben en la misma pasada.
        lote = this.pendientes().filter(f => f.dueno === idRegistro && f.estado === 'pendiente' && !intentadas.has(f.id));
      }
    } finally {
      this.subiendo.set(false);
    }
    if (subidas) this.cambiaron.emit();
    return subidas;
  }

  reintentar(): void {
    const id = this.idRegistro();
    if (id && !this.subiendo() && !this.diferirSubida()) void this.subirPendientes(id);
  }

  descartar(id: number): void {
    this.pendientes.update(lista => lista.filter(f => f.id !== id));
  }

  /** Vacía la cola (al cancelar un registro nuevo). */
  limpiar(): void {
    this.pendientes.set([]);
  }

  private marcar(id: number, estado: Cal001FotoPendiente['estado'], mensaje: string): void {
    this.pendientes.update(lista => lista.map(f => f.id === id ? { ...f, estado, mensaje } : f));
  }

  verPendiente(foto: Cal001FotoPendiente): void {
    this.mostrar(foto.nombre, `data:image/jpeg;base64,${foto.base64}`);
  }

  /** Abre el visor y deja el foco en «Cerrar». */
  private mostrar(titulo: string, url: string): void {
    this.vista.set({ titulo, url });
    afterNextRender(() => this.cerrarVisor()?.nativeElement.focus(), { injector: this.injector });
  }

  /** El visor cierra con «Cerrar», con clic en el fondo y con la tecla Escape. */
  @HostListener('document:keydown.escape')
  cerrarVista(): void {
    this.vista.set(null);
  }

  async ver(foto: Cal001Foto): Promise<void> {
    this.cargandoVista.set(foto.ID_FOTO_NC);
    try {
      const archivo = await this.servicio.foto(foto.ID_FOTO_NC);
      this.mostrar(foto.NOMBRE_ORIGINAL, `data:${archivo.MIME};base64,${archivo.BASE64}`);
    } catch (error) {
      this.aviso.emit(mensajeError(error).mensaje);
    } finally {
      this.cargandoVista.set(null);
    }
  }

  async retirar(foto: Cal001Foto): Promise<void> {
    const respuesta = await Swal.fire({
      title: 'Retirar foto',
      text: `¿Retirar ${foto.NOMBRE_ORIGINAL} de la evidencia? Queda registrado quién la retiró.`,
      input: 'text',
      inputPlaceholder: 'Motivo (opcional)',
      inputAttributes: { maxlength: String(Cal001Limits.Reason) },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Retirar',
      cancelButtonText: 'Cancelar'
    });
    if (!respuesta.isConfirmed) return;
    try {
      await this.servicio.retirarFoto(foto.ID_FOTO_NC, String(respuesta.value ?? '').trim());
      this.cambiaron.emit();
    } catch (error) {
      this.aviso.emit(mensajeError(error).mensaje);
    }
  }
}
