import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Cal001Limits, Cal001Origen } from '../../constants/cal-001.constants';
import type { Cal001Causa, Cal001CausaBorrador, Cal001Operario, Cal001OperarioBorrador, Cal001ParteBorrador } from '../../models/cal-001.model';
import { operarioDesdeMaestro } from '../../utils/cal-001-modelo';
import { XteinCal001BuscadorComponent, type Cal001OpcionBusqueda } from '../xtein-cal001-buscador/xtein-cal001-buscador.component';
import { XteinCal001CausaSelectorComponent } from '../xtein-cal001-causa-selector/xtein-cal001-causa-selector.component';

/**
 * No conformidades de una parte (nivel 3) y, por cada una, sus operarios con ocurrencias 1-999 (nivel 4).
 * El proceso del operario sale de su sección principal (historia 4). Emite la parte completa ya modificada.
 */
@Component({
  selector: 'xtein-cal001-detalle-parte',
  standalone: true,
  imports: [XteinCal001CausaSelectorComponent, XteinCal001BuscadorComponent],
  templateUrl: './xtein-cal001-detalle-parte.component.html',
  styleUrl: './xtein-cal001-detalle-parte.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001DetalleParteComponent {
  readonly parte = input.required<Cal001ParteBorrador>();
  readonly causas = input<readonly Cal001Causa[]>([]);
  readonly origen = input<Cal001Origen>(Cal001Origen.Produccion);
  readonly editable = input(false);
  readonly buscarOperarios = input.required<(texto: string) => Promise<Cal001OpcionBusqueda<Cal001Operario>[]>>();
  readonly cambio = output<Cal001ParteBorrador>();
  readonly aviso = output<string>();

  readonly limites = Cal001Limits;
  readonly agregando = signal(false);
  readonly esCliente = computed(() => this.origen() === Cal001Origen.Cliente);
  readonly usadas = computed(() => this.parte().CAUSAS.map(c => c.ID_CAUSA));

  private emitir(causas: Cal001CausaBorrador[]): void {
    this.cambio.emit({ ...this.parte(), CAUSAS: causas });
  }

  private actualizarCausa(indice: number, cambio: (causa: Cal001CausaBorrador) => Cal001CausaBorrador): void {
    this.emitir(this.parte().CAUSAS.map((causa, i) => i === indice ? cambio(causa) : causa));
  }

  agregarCausa(causa: Cal001Causa): void {
    this.agregando.set(false);
    if (this.parte().CAUSAS.length >= Cal001Limits.CausesPerPart) {
      this.aviso.emit(`Máximo ${Cal001Limits.CausesPerPart} no conformidades por parte.`);
      return;
    }
    this.emitir([...this.parte().CAUSAS, {
      ID_CAUSA_NC: null, ID_CAUSA: causa.ID_CAUSA, NOMBRE: causa.NOMBRE, DESCRIPCION: causa.DESCRIPCION, OPERARIOS: []
    }]);
  }

  cambiarCausa(indice: number, causa: Cal001Causa): void {
    this.actualizarCausa(indice, actual => ({ ...actual, ID_CAUSA: causa.ID_CAUSA, NOMBRE: causa.NOMBRE, DESCRIPCION: causa.DESCRIPCION }));
  }

  quitarCausa(indice: number): void {
    this.emitir(this.parte().CAUSAS.filter((_, i) => i !== indice));
  }

  agregarOperario(indice: number, operario: Cal001Operario): void {
    const causa = this.parte().CAUSAS[indice];
    if (!causa) return;
    if (causa.OPERARIOS.some(o => o.ID_EMPLEADO === operario.ID_EMPLEADO)) {
      this.aviso.emit(`${operario.NOMBRE} ya está en la no conformidad ${causa.ID_CAUSA}.`);
      return;
    }
    if (causa.OPERARIOS.length >= Cal001Limits.OperatorsPerCause) {
      this.aviso.emit(`Máximo ${Cal001Limits.OperatorsPerCause} operarios por no conformidad.`);
      return;
    }
    if (!operario.SECCIONES.length) {
      this.aviso.emit(`${operario.NOMBRE} no tiene una sección activa en Empleados por sección; no se puede asignar.`);
      return;
    }
    const nuevo = operarioDesdeMaestro(operario);
    if (!nuevo.ID_SECCION) this.aviso.emit(`${operario.NOMBRE} tiene varias secciones: elija su proceso.`);
    this.actualizarCausa(indice, actual => ({ ...actual, OPERARIOS: [...actual.OPERARIOS, nuevo] }));
  }

  private actualizarOperario(indice: number, posicion: number, cambio: Partial<Cal001OperarioBorrador>): void {
    this.actualizarCausa(indice, causa => ({
      ...causa, OPERARIOS: causa.OPERARIOS.map((o, j) => j === posicion ? { ...o, ...cambio } : o)
    }));
  }

  cambiarOcurrencias(indice: number, posicion: number, texto: string): void {
    const valor = texto.trim() === '' ? null : Number(texto);
    this.actualizarOperario(indice, posicion, { OCURRENCIAS: valor !== null && Number.isFinite(valor) ? valor : null });
  }

  cambiarSeccion(indice: number, posicion: number, operario: Cal001OperarioBorrador, idSeccion: string): void {
    const seccion = operario.SECCIONES.find(s => s.ID_SECCION === idSeccion);
    this.actualizarOperario(indice, posicion, { ID_SECCION: seccion?.ID_SECCION ?? null, DESCRIPCION_SECCION: seccion?.DESCRIPCION ?? '' });
  }

  quitarOperario(indice: number, posicion: number): void {
    this.actualizarCausa(indice, causa => ({ ...causa, OPERARIOS: causa.OPERARIOS.filter((_, j) => j !== posicion) }));
  }

  ocurrenciasInvalidas(valor: number | null): boolean {
    return valor === null || !Number.isInteger(valor) || valor < Cal001Limits.MinOccurrences || valor > Cal001Limits.MaxOccurrences;
  }
}
