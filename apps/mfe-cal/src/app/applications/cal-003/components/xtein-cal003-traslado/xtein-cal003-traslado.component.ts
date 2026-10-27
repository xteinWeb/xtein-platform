import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordToolbarMode, ToolbarAction } from '@xtein/sdk';
import {
  XteinButtonComponent,
  XteinCheckboxComponent,
  XteinGroupLabelComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLookupComponent,
  XteinRecordFilterCriterion,
  XteinRecordViewComponent
} from '@xtein/ui';
import { Cal003FilterTable, Cal003TransferStatus } from '../../constants/cal-003.constants';
import { Cal003BodegaColumns, Cal003ServicioColumns, Cal003TrasladoViewColumns } from '../../constants/cal-003-ui.constants';
import type { Cal003Servicio, Cal003ServicioCompleto, Cal003Traslado, Cal003Unidad } from '../../models/cal-003.model';
import { Cal003ContextoService, Cal003EstadoBarra, Cal003Pestana } from '../../services/cal-003-contexto.service';
import { estadoBadge } from '../../utils/cal-003-formato';

type Cal003ServicioTrasladable = Cal003ServicioCompleto
  & Pick<Cal003Servicio, 'ID_SERVICIO' | 'DOCUMENTO' | 'NOMBRE' | 'NOMBRE_CLIENTE' | 'ESTADO'>
  & { LABEL: string };

/**
 * Traslado: mueve el producto o algunas de sus partes a otra bodega. Queda hecho solo cuando quien
 * recibe en la bodega destino lo autoriza; mientras tanto sigue en el origen.
 * Como en la Entrada: Nuevo para enviar uno, Buscar para ver, recibir o rechazar los existentes.
 */
@Component({
  selector: 'xtein-cal003-traslado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinButtonComponent,
    XteinCheckboxComponent,
    XteinGroupLabelComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLookupComponent,
    XteinRecordViewComponent
  ],
  templateUrl: './xtein-cal003-traslado.component.html',
  styleUrl: './xtein-cal003-traslado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003TrasladoComponent implements Cal003Pestana {
  readonly ctx = inject(Cal003ContextoService);
  readonly bodegaColumns = Cal003BodegaColumns;
  readonly servicioColumns = Cal003ServicioColumns;
  readonly badge = estadoBadge;
  readonly estados = Cal003TransferStatus;

  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Cal003Traslado[]>([]);
  readonly currentIndex = signal(-1);

  // Traslado nuevo
  readonly servicios = signal<Cal003ServicioTrasladable[]>([]);
  readonly idServicio = signal<number | null>(null);
  readonly marcadas = signal<number[]>([]);
  readonly destino = signal<string>('');

  // Ver de la barra (Buscar lo maneja la pantalla: un solo buscador con el campo Operación)
  readonly viewColumns = Cal003TrasladoViewColumns;
  readonly viewVisible = signal(false);

  /** Quien gestiona las garantías envía desde cualquier bodega; la persona de planta, desde las suyas. */
  readonly puedeEnviar = computed(() => this.ctx.puedeCrear() || this.ctx.misBodegas().length > 0);
  readonly creando = computed(() => this.mode() === RecordToolbarMode.Creating);
  readonly abierto = computed(() => this.mode() === RecordToolbarMode.Browsing ? this.records()[this.currentIndex()] ?? null : null);

  readonly barra = computed<Cal003EstadoBarra>(() => ({
    mode: this.mode(),
    currentIndex: this.currentIndex(),
    total: this.records().length
  }));

  readonly servicio = computed(() => this.servicios().find(s => s.ID_SERVICIO === this.idServicio()) ?? null);

  readonly unidadesMarcadas = computed(() => {
    const ids = this.marcadas();
    return (this.servicio()?.UNIDADES ?? []).filter(u => ids.includes(u.ID_UNIDAD));
  });

  readonly origenes = computed(() => [...new Set(this.unidadesMarcadas().map(u => u.ID_UN_BODEGA ?? ''))]);

  readonly origenTexto = computed(() => {
    const o = this.origenes();
    return o.length === 1 ? `${o[0]} · ${this.ctx.bodega(o[0])}` : o.length > 1 ? 'Varias bodegas' : '';
  });

  readonly destinos = computed(() => this.ctx.bodegas().filter(b => !this.origenes().includes(b.ID_UN_BODEGA)));

  // ================= Barra =================

  async ejecutar(accion: string, payload?: unknown): Promise<void> {
    switch (accion) {
      case ToolbarAction.New: return this.nuevo();
      case ToolbarAction.Save: return this.enviar();
      case ToolbarAction.Cancel: return this.cancelar();
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

  /** Enviando: vuelve a traer los servicios. Viendo uno: lo vuelve a traer para ver si ya lo recibieron. */
  async refrescar(): Promise<void> {
    if (this.creando()) {
      await this.cargarServicios();
      return;
    }
    const actual = this.abierto();
    if (!actual) return;
    const filas = await this.ctx.ejecutar(() => this.ctx.api.traslados(this.porDocumento(actual.DOCUMENTO)));
    const nuevo = filas?.find(t => t.ID_TRASLADO === actual.ID_TRASLADO);
    if (nuevo) this.records.update(list => list.map(r => r.ID_TRASLADO === nuevo.ID_TRASLADO ? nuevo : r));
  }

  // ================= Traslado nuevo =================

  async nuevo(): Promise<void> {
    if (!this.puedeEnviar()) {
      this.ctx.advertir('El traslado lo envía quien gestiona las garantías o quien está en la bodega de origen.');
      return;
    }
    this.limpiar();
    this.mode.set(RecordToolbarMode.Creating);
    await this.cargarServicios();
  }

  async cancelar(): Promise<void> {
    if (this.marcadas().length > 0 && !(await this.ctx.confirmar('¿Desea descartar el traslado que está preparando?', 'Sí, descartar'))) return;
    this.limpiar();
    this.mode.set(this.records().length ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
    if (!this.records().length) this.currentIndex.set(-1);
  }

  private async cargarServicios(): Promise<void> {
    const servicios = await this.ctx.ejecutar(() => this.ctx.api.serviciosTrasladables());
    if (!servicios) return;
    this.servicios.set(servicios.map(s => ({
      ...s,
      ID_SERVICIO: s.SERVICIO.ID_SERVICIO,
      DOCUMENTO: s.SERVICIO.DOCUMENTO,
      NOMBRE: s.SERVICIO.NOMBRE,
      NOMBRE_CLIENTE: s.SERVICIO.NOMBRE_CLIENTE,
      ESTADO: s.SERVICIO.ESTADO,
      LABEL: `${s.SERVICIO.DOCUMENTO} · ${s.SERVICIO.NOMBRE}${s.SERVICIO.ESTADO === 'INACTIVO' ? ' (INACTIVO)' : ''}`
    })));
    if (this.idServicio() !== null && !this.servicio()) this.limpiar();
    this.marcadas.update(ids => ids.filter(id => this.servicio()?.UNIDADES.some(u => u.ID_UNIDAD === id && !u.TRASLADO_PENDIENTE)));
  }

  elegirServicio(id: number | null): void {
    this.idServicio.set(id);
    this.marcadas.set([]);
    this.destino.set('');
  }

  marcar(unidad: Cal003Unidad, marcada: boolean): void {
    this.marcadas.update(ids => marcada ? [...new Set([...ids, unidad.ID_UNIDAD])] : ids.filter(id => id !== unidad.ID_UNIDAD));
    if (this.destino() && this.origenes().includes(this.destino())) this.destino.set('');
  }

  async enviar(): Promise<void> {
    if (!this.creando()) return;
    const servicio = this.servicio();
    if (!servicio) return this.ctx.advertir('Escoge el servicio.');
    if (!this.marcadas().length) return this.ctx.advertir('Marca el producto o las partes que se trasladan.');
    if (this.origenes().length > 1) {
      return this.ctx.advertir(`Un traslado sale de una sola bodega: las partes marcadas están en ${this.origenes().join(' y ')}. Haz un traslado por bodega.`);
    }
    if (!this.destino()) return this.ctx.advertir('Escoge la bodega destino.');
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.trasladoEnviar(servicio.ID_SERVICIO, this.destino(), this.marcadas()));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    this.limpiar();
    // Queda abierto el traslado recién enviado
    const documento = resultado.DOCUMENTO ?? '';
    const filas = documento ? await this.ctx.ejecutar(() => this.ctx.api.traslados(this.porDocumento(documento))) : null;
    const enviado = (filas ?? []).find(t => t.DOCUMENTO === documento);
    if (enviado) {
      this.records.set([enviado]);
      this.currentIndex.set(0);
      this.mode.set(RecordToolbarMode.Browsing);
    } else {
      this.mode.set(RecordToolbarMode.Initial);
    }
  }

  // ================= Buscar y Ver de la barra =================

  /** Ver: la lista de lo que trajo Buscar. */
  abrirVer(): void {
    if (this.creando()) return;
    if (!this.records().length) {
      this.ctx.advertir('Primero usa Buscar en la barra de acciones.');
      return;
    }
    this.viewVisible.set(true);
  }

  /** Lo llama la pantalla con los criterios del buscador de la barra (sin el campo Operación). */
  async buscar(criterios: XteinRecordFilterCriterion[]): Promise<void> {
    const encontrados = await this.ctx.ejecutar(() => this.ctx.api.traslados(criterios));
    if (!encontrados) return;
    if (!encontrados.length) {
      this.ctx.advertir('No se encontraron registros con el criterio especificado.');
      return;
    }
    this.records.set(encontrados);
    this.irA(0);
    this.ctx.informar(`Se encontraron ${encontrados.length} traslado(s).`);
  }

  verRegistro(registro: object): void {
    this.viewVisible.set(false);
    const id = (registro as Cal003Traslado)?.ID_TRASLADO;
    const indice = this.records().findIndex(r => r.ID_TRASLADO === id);
    if (indice >= 0) this.irA(indice);
  }

  // ================= Navegación =================

  irA(indice: number): void {
    if (this.creando() || indice < 0 || indice >= this.records().length) return;
    this.currentIndex.set(indice);
    this.mode.set(RecordToolbarMode.Browsing);
  }

  // ================= Recibir / rechazar el traslado abierto =================

  async recibir(): Promise<void> {
    const t = this.abierto();
    if (!t) return;
    if (!(await this.ctx.confirmar(`¿Recibir <b>${t.DOCUMENTO}</b> en ${t.BODEGA_DESTINO}?<br>${t.QUE_SE_TRASLADA}`, 'Sí, recibir'))) return;
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.trasladoRecibir(t.ID_TRASLADO));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    await this.refrescar();
  }

  async rechazar(): Promise<void> {
    const t = this.abierto();
    if (!t) return;
    const observacion = await this.ctx.pedirObservacion(`Rechazar ${t.DOCUMENTO}`,
      `<p>El producto se queda en ${t.BODEGA_ORIGEN} y se avisa a quien envió.</p>`, 'Rechazar', 'Por qué se rechaza');
    if (!observacion) return;
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.trasladoRechazar(t.ID_TRASLADO, observacion));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    await this.refrescar();
  }

  // ================= Utilidades =================

  estadoTexto(estado: string): string {
    return estado === Cal003TransferStatus.Sent ? 'Enviado, pendiente de recibir' : estado;
  }

  nombreUnidad(u: Cal003Unidad): string {
    const base = u.NOMBRE_PARTE ? `${u.NOMBRE_PRODUCTO} · ${u.NOMBRE_PARTE}` : u.NOMBRE_PRODUCTO;
    return u.NOMBRE_JUEGO ? `${u.NOMBRE_JUEGO} › ${base}` : base;
  }

  private porDocumento(documento: string): XteinRecordFilterCriterion[] {
    return [{ CAMPO: 'DOCUMENTO', EXPRESION: documento, TABLA: Cal003FilterTable }];
  }

  private limpiar(): void {
    this.idServicio.set(null);
    this.marcadas.set([]);
    this.destino.set('');
  }
}
