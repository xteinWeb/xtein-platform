import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Cal001Origen } from '../../constants/cal-001.constants';
import type { Cal001ConsultaFiltro, Cal001ConsultaResultado, Cal001ConsultaFila } from '../../models/cal-001.model';
import { mostrarFecha } from '../../utils/cal-001-fecha';
import { nombreConArea } from '../../utils/cal-001-modelo';

/**
 * Pestaña Consulta (historia 9): registros de todos los usuarios, con filtros de fecha del evento, origen y
 * documento, paginación y exportación a Excel por operario y causa. Abrir uno ajeno es solo lectura.
 * Fase 2: columna de no conformidades, "Registrado por" con nombre · área y, solo para el gestor (DP-L),
 * filtro por cédula del operario.
 */
@Component({
  selector: 'xtein-cal001-consulta',
  standalone: true,
  templateUrl: './xtein-cal001-consulta.component.html',
  styleUrl: './xtein-cal001-consulta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001ConsultaComponent {
  readonly resultado = input<Cal001ConsultaResultado | null>(null);
  readonly filtroInicial = input.required<Cal001ConsultaFiltro>();
  readonly usuario = input('');
  readonly esGestor = input(false);
  readonly cargando = input(false);
  readonly exportando = input<string>('');
  readonly abiertoId = input<number | null>(null);
  readonly buscar = output<Cal001ConsultaFiltro>();
  readonly pagina = output<number>();
  readonly abrir = output<Cal001ConsultaFila>();
  readonly exportar = output<void>();

  readonly origenes = Cal001Origen;
  readonly fecha = mostrarFecha;
  readonly editado = signal<Partial<Cal001ConsultaFiltro>>({});
  readonly filtro = computed<Cal001ConsultaFiltro>(() => ({ ...this.filtroInicial(), ...this.editado() }));
  readonly paginas = computed(() => {
    const r = this.resultado();
    return r ? Math.max(1, Math.ceil(r.TOTAL / Math.max(1, r.TAMANO))) : 1;
  });

  cambiar<K extends keyof Cal001ConsultaFiltro>(campo: K, valor: Cal001ConsultaFiltro[K]): void {
    this.editado.update(actual => ({ ...actual, [campo]: valor }));
  }

  enviar(evento: Event): void {
    evento.preventDefault();
    this.buscar.emit(this.filtro());
  }

  registradoPor(fila: Cal001ConsultaFila): string {
    return nombreConArea(fila.NOMBRE_USUARIO_CREA, fila.AREA_USUARIO_CREA, fila.USUARIO_CREA);
  }

  origen(valor: string): string {
    return valor === Cal001Origen.Cliente ? 'Cliente' : 'Producción';
  }
}
