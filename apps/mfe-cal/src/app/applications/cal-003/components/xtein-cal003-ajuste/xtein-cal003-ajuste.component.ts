import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '@xtein/session';
import { RecordToolbarMode, ToolbarAction } from '@xtein/sdk';
import {
  XteinButtonComponent,
  XteinGroupLabelComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLookupComponent,
  XteinRecordFilterComponent,
  XteinRecordFilterCriterion,
  XteinRecordFilterResult,
  XteinRecordViewComponent,
  XteinSelectComponent
} from '@xtein/ui';
import { Cal003AdjustmentStatus, Cal003FilterTable } from '../../constants/cal-003.constants';
import { Cal003AjusteViewColumns, Cal003DestinoOpciones, Cal003ServicioColumns } from '../../constants/cal-003-ui.constants';
import type { Cal003Ajuste, Cal003Destino, Cal003Servicio } from '../../models/cal-003.model';
import { Cal003ContextoService, Cal003EstadoBarra, Cal003Pestana } from '../../services/cal-003-contexto.service';
import { estadoBadge } from '../../utils/cal-003-formato';

/**
 * Salida · Ajuste: quien gestiona las garantías propone NUEVO, ESPECIAL o BAJA y quien hace las
 * devoluciones lo autoriza o rechaza. El servicio sale del inventario solo al autorizar.
 * Como en la Entrada: Nuevo para proponer, Buscar para ver, autorizar o rechazar los existentes.
 */
@Component({
  selector: 'xtein-cal003-ajuste',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinButtonComponent,
    XteinGroupLabelComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLookupComponent,
    XteinRecordFilterComponent,
    XteinRecordViewComponent,
    XteinSelectComponent
  ],
  templateUrl: './xtein-cal003-ajuste.component.html',
  styleUrl: './xtein-cal003-ajuste.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003AjusteComponent implements Cal003Pestana {
  readonly ctx = inject(Cal003ContextoService);
  private readonly session = inject(SessionService);
  readonly destinos = Cal003DestinoOpciones;
  readonly servicioColumns = Cal003ServicioColumns;
  readonly badge = estadoBadge;
  readonly estados = Cal003AdjustmentStatus;

  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Cal003Ajuste[]>([]);
  readonly currentIndex = signal(-1);

  // Ajuste nuevo
  readonly servicios = signal<(Cal003Servicio & { LABEL: string })[]>([]);
  readonly idServicio = signal<number | null>(null);
  readonly destino = signal<Cal003Destino | ''>('');

  // Buscar y Ver de la barra
  readonly filterTable = Cal003FilterTable.Adjustments;
  readonly viewColumns = Cal003AjusteViewColumns;
  readonly filterVisible = signal(false);
  readonly viewVisible = signal(false);

  readonly usuario = this.session.current?.userId ?? '';

  readonly creando = computed(() => this.mode() === RecordToolbarMode.Creating);
  readonly abierto = computed(() => this.mode() === RecordToolbarMode.Browsing ? this.records()[this.currentIndex()] ?? null : null);
  readonly puedeResponder = computed(() =>
    this.ctx.puedeAutorizar() && this.abierto()?.ESTADO === Cal003AdjustmentStatus.Proposed);

  readonly barra = computed<Cal003EstadoBarra>(() => ({
    mode: this.mode(),
    currentIndex: this.currentIndex(),
    total: this.records().length
  }));

  // ================= Barra =================

  async ejecutar(accion: string, payload?: unknown): Promise<void> {
    switch (accion) {
      case ToolbarAction.New: return this.nuevo();
      case ToolbarAction.Save: return this.proponer();
      case ToolbarAction.Cancel: return this.cancelar();
      case ToolbarAction.Search: return this.abrirBuscar();
      case ToolbarAction.View: return this.abrirVer();
      case ToolbarAction.Refresh: return this.refrescar();
      case ToolbarAction.First: return this.irA(0);
      case ToolbarAction.Previous: return this.irA(this.currentIndex() - 1);
      case ToolbarAction.Next: return this.irA(this.currentIndex() + 1);
      case ToolbarAction.Last: return this.irA(this.records().length - 1);
      case ToolbarAction.GoTo:
        if (typeof payload === 'number' && Number.isInteger(payload)) return this.irA(payload - 1);
        return;
      default: return;
    }
  }

  /** Proponiendo: vuelve a traer los servicios. Viendo uno: lo vuelve a traer para ver si ya lo respondieron. */
  async refrescar(): Promise<void> {
    if (this.creando()) {
      await this.cargarServicios();
      return;
    }
    const actual = this.abierto();
    if (!actual) return;
    const filas = await this.ctx.ejecutar(() => this.ctx.api.ajustes(this.porServicio(actual.SERVICIO)));
    const nuevo = filas?.find(a => a.ID_AJUSTE === actual.ID_AJUSTE);
    if (nuevo) this.records.update(list => list.map(r => r.ID_AJUSTE === nuevo.ID_AJUSTE ? nuevo : r));
  }

  // ================= Ajuste nuevo =================

  async nuevo(): Promise<void> {
    if (!this.ctx.puedeCrear()) {
      this.ctx.advertir('El ajuste lo propone quien gestiona las garantías.');
      return;
    }
    this.limpiar();
    this.mode.set(RecordToolbarMode.Creating);
    await this.cargarServicios();
  }

  cancelar(): void {
    this.limpiar();
    this.mode.set(this.records().length ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
    if (!this.records().length) this.currentIndex.set(-1);
  }

  private async cargarServicios(): Promise<void> {
    const servicios = await this.ctx.ejecutar(() => this.ctx.api.serviciosAjustables());
    if (!servicios) return;
    this.servicios.set(servicios.map(s => ({ ...s, LABEL: `${s.DOCUMENTO} · ${s.NOMBRE} · ${s.NOMBRE_CLIENTE}` })));
    if (this.idServicio() !== null && !this.servicios().some(s => s.ID_SERVICIO === this.idServicio())) this.idServicio.set(null);
  }

  async proponer(): Promise<void> {
    if (!this.creando()) return;
    const id = this.idServicio();
    const destino = this.destino();
    if (id === null) return this.ctx.advertir('Escoge el servicio.');
    if (!destino) return this.ctx.advertir('Escoge el destino.');
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.ajusteProponer(id, destino));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    this.limpiar();
    // Queda abierto el ajuste recién propuesto
    const documento = this.servicios().find(s => s.ID_SERVICIO === id)?.DOCUMENTO ?? '';
    const filas = await this.ctx.ejecutar(() => this.ctx.api.ajustes(documento ? this.porServicio(documento) : []));
    const propuesto = (filas ?? []).find(a => a.ID_SERVICIO === id && a.ESTADO === Cal003AdjustmentStatus.Proposed);
    if (propuesto) {
      this.records.set([propuesto]);
      this.currentIndex.set(0);
      this.mode.set(RecordToolbarMode.Browsing);
    } else {
      this.mode.set(RecordToolbarMode.Initial);
    }
  }

  // ================= Buscar y Ver de la barra =================

  /** Buscar: el filtro estándar de la plataforma (campos en ITM_DOMINIOS COLUMNAS / FILTRO). */
  abrirBuscar(): void {
    if (!this.creando()) this.filterVisible.set(true);
  }

  /** Ver: la lista de lo que trajo Buscar. */
  abrirVer(): void {
    if (this.creando()) return;
    if (!this.records().length) {
      this.ctx.advertir('Primero usa Buscar en la barra de acciones.');
      return;
    }
    this.viewVisible.set(true);
  }

  async buscar(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    const encontrados = await this.ctx.ejecutar(() => this.ctx.api.ajustes(result?.ESTRUCTURA ?? []));
    if (!encontrados) return;
    if (!encontrados.length) {
      this.ctx.advertir('No se encontraron registros con el criterio especificado.');
      return;
    }
    this.records.set(encontrados);
    this.irA(0);
    this.ctx.informar(`Se encontraron ${encontrados.length} ajuste(s).`);
  }

  verRegistro(registro: object): void {
    this.viewVisible.set(false);
    const id = (registro as Cal003Ajuste)?.ID_AJUSTE;
    const indice = this.records().findIndex(r => r.ID_AJUSTE === id);
    if (indice >= 0) this.irA(indice);
  }

  // ================= Navegación =================

  irA(indice: number): void {
    if (this.creando() || indice < 0 || indice >= this.records().length) return;
    this.currentIndex.set(indice);
    this.mode.set(RecordToolbarMode.Browsing);
  }

  // ================= Autorizar / rechazar el ajuste abierto =================

  async autorizar(): Promise<void> {
    const a = this.abierto();
    if (!a) return;
    const resultado = this.destinos.find(d => d.valor === a.DESTINO)?.resultado ?? '';
    if (!(await this.ctx.confirmar(`¿Autorizar el ajuste de <b>${a.SERVICIO}</b> a <b>${a.DESTINO}</b>?<br>${resultado}.`, 'Sí, autorizar'))) return;
    const r = await this.ctx.ejecutar(() => this.ctx.api.ajusteAutorizar(a.ID_AJUSTE));
    if (!r) return;
    this.ctx.exito(r.MENSAJE);
    await this.refrescar();
  }

  async rechazar(): Promise<void> {
    const a = this.abierto();
    if (!a) return;
    const efecto = a.DESTINO === 'BAJA'
      ? 'Una BAJA rechazada pasa sola a ESPECIAL (entra a ARTDECON sin precio).'
      : 'Vuelve a quien gestiona las garantías para tipificarlo otra vez.';
    const observacion = await this.ctx.pedirObservacion(`Rechazar el ajuste de ${a.SERVICIO}`, `<p>${efecto}</p>`, 'Rechazar', 'Por qué se rechaza');
    if (!observacion) return;
    const r = await this.ctx.ejecutar(() => this.ctx.api.ajusteRechazar(a.ID_AJUSTE, observacion));
    if (!r) return;
    this.ctx.exito(r.MENSAJE);
    await this.refrescar();
  }

  // ================= Utilidades =================

  estadoTexto(estado: string): string {
    return estado === Cal003AdjustmentStatus.Proposed ? 'Propuesto, pendiente de autorizar' : estado;
  }

  private porServicio(documento: string): XteinRecordFilterCriterion[] {
    return [{ CAMPO: 'SERVICIO', EXPRESION: documento, TABLA: this.filterTable }];
  }

  private limpiar(): void {
    this.idServicio.set(null);
    this.destino.set('');
  }
}
