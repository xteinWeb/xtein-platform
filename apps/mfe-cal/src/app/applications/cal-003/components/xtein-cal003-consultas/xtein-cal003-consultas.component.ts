import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordToolbarMode, ToolbarAction } from '@xtein/sdk';
import { XteinLabelComponent, XteinLookupComponent, XteinSelectComponent } from '@xtein/ui';
import { Cal003BodegaColumns, Cal003ClienteColumns, Cal003ConsultaOpciones, Cal003ServicioColumns } from '../../constants/cal-003-ui.constants';
import type { Cal003Historial, Cal003InventarioFila, Cal003Servicio, Cal003ServicioCliente } from '../../models/cal-003.model';
import { Cal003ContextoService, Cal003EstadoBarra, Cal003Pestana } from '../../services/cal-003-contexto.service';
import { estadoBadge, fecha } from '../../utils/cal-003-formato';

type Cal003TipoConsulta = typeof Cal003ConsultaOpciones[number]['valor'];

/** Consultas: inventario por bodega, servicios de un cliente e historial de un servicio. */
@Component({
  selector: 'xtein-cal003-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, XteinLabelComponent, XteinLookupComponent, XteinSelectComponent],
  templateUrl: './xtein-cal003-consultas.component.html',
  styleUrl: './xtein-cal003-consultas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003ConsultasComponent implements Cal003Pestana {
  readonly ctx = inject(Cal003ContextoService);
  readonly opciones = Cal003ConsultaOpciones;
  readonly clienteColumns = Cal003ClienteColumns;
  readonly bodegaColumns = Cal003BodegaColumns;
  readonly servicioColumns = Cal003ServicioColumns;
  readonly fecha = fecha;
  readonly badge = estadoBadge;

  readonly tipo = signal<Cal003TipoConsulta>('bodega');
  readonly bodega = signal('');
  readonly cliente = signal('');
  readonly idServicio = signal<number | null>(null);
  readonly servicios = signal<(Cal003Servicio & { LABEL: string })[]>([]);

  readonly inventario = signal<Cal003InventarioFila[]>([]);
  readonly porCliente = signal<Cal003ServicioCliente[]>([]);
  readonly historial = signal<Cal003Historial[]>([]);

  readonly barra = computed<Cal003EstadoBarra>(() => ({ mode: RecordToolbarMode.Initial, currentIndex: -1, total: 0 }));

  readonly nota = computed(() => this.ctx.veTodas()
    ? 'Ves todas las bodegas.'
    : `Como persona de planta solo ves tus bodegas (${this.ctx.misBodegas().join(', ') || 'ninguna'}).`);

  async ejecutar(accion: string): Promise<void> {
    if (accion === ToolbarAction.Refresh) await this.refrescar();
  }

  async refrescar(): Promise<void> {
    if (this.tipo() === 'bodega' && !this.bodega() && this.ctx.bodegasVisibles().length) {
      this.bodega.set(this.ctx.bodegasVisibles()[0].ID_UN_BODEGA);
    }
    switch (this.tipo()) {
      case 'bodega': return this.consultarBodega();
      case 'cliente': return this.consultarCliente();
      default:
        await this.cargarServicios();
        return this.consultarHistorial();
    }
  }

  async cambiarTipo(tipo: Cal003TipoConsulta | null): Promise<void> {
    this.tipo.set(tipo ?? 'bodega');
    await this.refrescar();
  }

  async elegirBodega(id: string | null): Promise<void> {
    this.bodega.set(id ?? '');
    await this.consultarBodega();
  }

  async elegirCliente(id: string | null): Promise<void> {
    this.cliente.set(id ?? '');
    await this.consultarCliente();
  }

  async elegirServicio(id: number | null): Promise<void> {
    this.idServicio.set(id);
    await this.consultarHistorial();
  }

  private async consultarBodega(): Promise<void> {
    if (!this.bodega()) return this.inventario.set([]);
    const rows = await this.ctx.ejecutar(() => this.ctx.api.inventarioBodega(this.bodega()));
    this.inventario.set(rows ?? []);
  }

  private async consultarCliente(): Promise<void> {
    if (!this.cliente()) return this.porCliente.set([]);
    const rows = await this.ctx.ejecutar(() => this.ctx.api.serviciosCliente(this.cliente()));
    this.porCliente.set(rows ?? []);
  }

  private async consultarHistorial(): Promise<void> {
    const id = this.idServicio();
    if (id === null) return this.historial.set([]);
    const rows = await this.ctx.ejecutar(() => this.ctx.api.historial(id));
    this.historial.set(rows ?? []);
  }

  private async cargarServicios(): Promise<void> {
    const rows = await this.ctx.ejecutar(() => this.ctx.api.servicios({ TEXTO: '', FECHA_DESDE: '2000-01-01', FECHA_HASTA: '' }));
    this.servicios.set((rows ?? []).map(s => ({ ...s, LABEL: `${s.DOCUMENTO} · ${s.NOMBRE} · ${s.NOMBRE_CLIENTE}` })));
  }
}
