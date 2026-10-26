import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Cal001NcPorOperario } from '../../models/cal-001.model';

/** Panel lateral "No conformidades por operario" (ajuste 3): qué se le anota a cada operario en este registro. */
@Component({
  selector: 'xtein-cal001-nc-operario',
  standalone: true,
  template: `
    <h2 class="no-titulo">No conformidades por operario</h2>
    @for (fila of filas(); track fila.ID_EMPLEADO) {
      <section class="no-operario" [attr.aria-label]="fila.NOMBRE">
        <div class="no-cabeza"><b>{{ fila.NOMBRE }}</b><span class="no-total">{{ fila.TOTAL }}</span></div>
        @if (fila.PROCESO) { <small class="no-proceso">{{ fila.PROCESO }}</small> }
        <ul>
          @for (causa of fila.CAUSAS; track causa.ID_CAUSA) {
            <li><span>{{ causa.ID_CAUSA }} · {{ causa.NOMBRE }}</span><span class="no-num">{{ causa.OCURRENCIAS }}</span></li>
          }
        </ul>
      </section>
    } @empty {
      <p class="no-nota">
        Sin operarios en este registro.
        @if (cliente()) { En origen Cliente se puede guardar así. } @else { En Producción hace falta al menos uno por no conformidad. }
      </p>
    }`,
  styles: [`
    :host { display: block; }
    .no-titulo { margin: 0 0 8px; padding: 6px 10px; border-radius: 6px; background: #0a3960; color: #fff; font-size: 13.5px; }
    .no-operario { padding: 8px 0; border-bottom: 1px solid #eef2f6; }
    .no-cabeza { display: flex; justify-content: space-between; gap: 8px; color: #1f3b57; overflow-wrap: anywhere; }
    .no-total { min-width: 28px; padding: 0 6px; border-radius: 10px; background: #e6eef7; color: #0a3960; text-align: center; font-weight: 700; }
    .no-proceso { color: #4a6a84; }
    ul { margin: 4px 0 0; padding: 0; list-style: none; }
    li { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; font-size: 13px; color: #334155; overflow-wrap: anywhere; }
    .no-num { font-variant-numeric: tabular-nums; }
    .no-nota { margin: 0; color: #7b8fa3; font-size: 13px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001NcOperarioComponent {
  readonly filas = input<readonly Cal001NcPorOperario[]>([]);
  readonly cliente = input(false);
}
