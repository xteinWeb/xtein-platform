import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Cal001Limits } from '../../constants/cal-001.constants';
import type { Cal001ParteBorrador } from '../../models/cal-001.model';

/**
 * Grilla de partes del PF (historia 2): Parte (PA), nombre, Pieza de texto libre (máx. 50) y conteos.
 * Tocar una fila abre sus no conformidades. En el celular cada parte es una tarjeta.
 */
@Component({
  selector: 'xtein-cal001-partes',
  standalone: true,
  templateUrl: './xtein-cal001-partes.component.html',
  styleUrl: './xtein-cal001-partes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001PartesComponent {
  readonly partes = input<readonly Cal001ParteBorrador[]>([]);
  readonly seleccionada = input<string | null>(null);
  readonly editable = input(false);
  readonly seleccionar = output<string>();
  readonly piezaCambio = output<{ clave: string; pieza: string }>();
  readonly maximoPieza = Cal001Limits.Piece;

  operarios(parte: Cal001ParteBorrador): number {
    return new Set(parte.CAUSAS.flatMap(causa => causa.OPERARIOS.map(o => o.ID_EMPLEADO))).size;
  }

  escribirPieza(parte: Cal001ParteBorrador, valor: string): void {
    this.piezaCambio.emit({ clave: parte.CLAVE, pieza: valor.slice(0, this.maximoPieza) });
  }
}
