import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal, viewChild
} from '@angular/core';
import type { Cal001Causa } from '../../models/cal-001.model';
import { descripcionVisible, filtrarCausas } from '../../utils/cal-001-causas';

let secuencia = 0;

/**
 * Desplegable de causales (ajuste 4): muestra Id, Nombre y Descripción (CAUSAS.DESCRIPCION, solo lectura),
 * busca en los tres campos y deja leer textos largos en varias líneas. En el celular se abre como hoja inferior.
 */
@Component({
  selector: 'xtein-cal001-causa-selector',
  standalone: true,
  templateUrl: './xtein-cal001-causa-selector.component.html',
  styleUrl: './xtein-cal001-causa-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001CausaSelectorComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly causas = input<readonly Cal001Causa[]>([]);
  readonly valor = input<string>('');
  readonly excluidas = input<readonly string[]>([]);
  readonly deshabilitado = input(false);
  readonly placeholder = input('Elegir no conformidad');
  readonly etiqueta = input('No conformidad');
  readonly elegida = output<Cal001Causa>();

  readonly id = `cal001-causa-${++secuencia}`;
  readonly abierto = signal(false);
  readonly texto = signal('');
  readonly activa = signal(0);
  private readonly buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');

  readonly actual = computed(() => this.causas().find(c => c.ID_CAUSA === this.valor()) ?? null);
  readonly opciones = computed(() => {
    const excluidas = new Set(this.excluidas());
    return filtrarCausas(this.causas().filter(c => c.ID_CAUSA === this.valor() || !excluidas.has(c.ID_CAUSA)), this.texto());
  });
  readonly descripcion = descripcionVisible;

  abrir(): void {
    if (this.deshabilitado()) return;
    this.texto.set('');
    this.activa.set(Math.max(0, this.opciones().findIndex(c => c.ID_CAUSA === this.valor())));
    this.abierto.set(true);
    setTimeout(() => this.buscador()?.nativeElement.focus());
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  buscar(texto: string): void {
    this.texto.set(texto);
    this.activa.set(0);
  }

  elegir(causa: Cal001Causa): void {
    this.abierto.set(false);
    if (causa.ID_CAUSA !== this.valor()) this.elegida.emit(causa);
  }

  teclado(evento: KeyboardEvent): void {
    const total = this.opciones().length;
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!total) return;
      const paso = evento.key === 'ArrowDown' ? 1 : -1;
      this.activa.set((this.activa() + paso + total) % total);
      setTimeout(() => this.host.nativeElement.querySelector(`#${this.id}-op-${this.activa()}`)?.scrollIntoView({ block: 'nearest' }));
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const causa = this.opciones()[this.activa()];
      if (causa) this.elegir(causa);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrar();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  fuera(evento: Event): void {
    if (this.abierto() && !this.host.nativeElement.contains(evento.target as Node)) this.cerrar();
  }
}
