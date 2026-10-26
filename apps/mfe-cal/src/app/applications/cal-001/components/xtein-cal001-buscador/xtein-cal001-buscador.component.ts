import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, inject, input, output, signal, viewChild
} from '@angular/core';
import { mensajeError } from '../../utils/cal-001-errores';

export interface Cal001OpcionBusqueda<T> {
  valor: T;
  codigo: string;
  nombre: string;
}

let secuencia = 0;

/**
 * Búsqueda en el servidor (producto PF, operario o cliente): escribe, espera 300 ms y pide hasta 50 coincidencias.
 * En el celular la lista se abre como hoja inferior.
 */
@Component({
  selector: 'xtein-cal001-buscador',
  standalone: true,
  templateUrl: './xtein-cal001-buscador.component.html',
  styleUrl: '../xtein-cal001-causa-selector/xtein-cal001-causa-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001BuscadorComponent<T> implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly buscar = input.required<(texto: string) => Promise<Cal001OpcionBusqueda<T>[]>>();
  /** Texto del valor actual (código · nombre), o vacío. */
  readonly actual = input('');
  readonly placeholder = input('Buscar');
  readonly etiqueta = input('Buscar');
  readonly deshabilitado = input(false);
  readonly elegido = output<T>();

  readonly id = `cal001-buscador-${++secuencia}`;
  readonly abierto = signal(false);
  readonly texto = signal('');
  readonly opciones = signal<Cal001OpcionBusqueda<T>[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly activa = signal(0);
  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private consulta = 0;

  abrir(): void {
    if (this.deshabilitado()) return;
    this.abierto.set(true);
    this.texto.set('');
    void this.consultar('');
    setTimeout(() => this.campo()?.nativeElement.focus());
  }

  cerrar(): void {
    this.abierto.set(false);
    if (this.temporizador) clearTimeout(this.temporizador);
  }

  escribir(texto: string): void {
    this.texto.set(texto);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => void this.consultar(texto.trim()), 300);
  }

  private async consultar(texto: string): Promise<void> {
    const numero = ++this.consulta;
    this.cargando.set(true);
    this.error.set('');
    try {
      const opciones = await this.buscar()(texto);
      if (numero !== this.consulta) return;
      this.opciones.set(opciones);
      this.activa.set(0);
    } catch (error) {
      if (numero !== this.consulta) return;
      this.opciones.set([]);
      this.error.set(mensajeError(error).mensaje);
    } finally {
      if (numero === this.consulta) this.cargando.set(false);
    }
  }

  elegir(opcion: Cal001OpcionBusqueda<T>): void {
    this.cerrar();
    this.elegido.emit(opcion.valor);
  }

  teclado(evento: KeyboardEvent): void {
    const total = this.opciones().length;
    if ((evento.key === 'ArrowDown' || evento.key === 'ArrowUp') && total) {
      evento.preventDefault();
      this.activa.set((this.activa() + (evento.key === 'ArrowDown' ? 1 : -1) + total) % total);
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const opcion = this.opciones()[this.activa()];
      if (opcion) this.elegir(opcion);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrar();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  fuera(evento: Event): void {
    if (this.abierto() && !this.host.nativeElement.contains(evento.target as Node)) this.cerrar();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.consulta++;
  }
}
