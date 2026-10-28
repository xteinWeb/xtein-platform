import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordToolbarMode, ToolbarAction } from '@xtein/sdk';
import {
  XteinButtonComponent,
  XteinGroupLabelComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLookupComponent,
  XteinPopupComponent,
  XteinRecordFilterCriterion,
  XteinRecordViewComponent
} from '@xtein/ui';
import { Cal003DeliveryStatus, Cal003Limits, Cal003ServiceType } from '../../constants/cal-003.constants';
import { Cal003BodegaColumns, Cal003ClienteColumns, Cal003EntregaViewColumns, Cal003ServicioEntregableColumns } from '../../constants/cal-003-ui.constants';
import type { Cal003Cabecera, Cal003Entrega, Cal003EntregaCompleta, Cal003Pieza, Cal003ServicioEntregable, Cal003Unidad } from '../../models/cal-003.model';
import { Cal003ContextoService, Cal003EstadoBarra, Cal003Pestana } from '../../services/cal-003-contexto.service';
import { estadoBadge, fecha, hoy } from '../../utils/cal-003-formato';

interface Cal003LineaVista {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  N_SERVICIO_CLIENTE: string | null;
  N_ORDEN_DEVOLUCION?: string | null;
  CODIGO_ASOCIADO: string | null;
  TIPO_SERVICIO: string;
  ESTADO: string;
  OBSERVACION_ANULA: string | null;
  PRODUCTO?: string;
  ESTADO_SERVICIO?: string;
  SALDO?: number;
  PIEZAS?: Cal003Pieza[];
  UNIDADES?: Cal003Unidad[];
}

/**
 * Salida · Entrega: documento de entrega al cliente. Solo entra un servicio que sale como llegó
 * (todas sus partes en la bodega de salida, sin traslados pendientes). Los servicios siguen en el
 * inventario hasta que se adjunta el soporte firmado por el cliente.
 */
@Component({
  selector: 'xtein-cal003-entrega',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinButtonComponent,
    XteinGroupLabelComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLookupComponent,
    XteinPopupComponent,
    XteinRecordViewComponent
  ],
  templateUrl: './xtein-cal003-entrega.component.html',
  styleUrl: './xtein-cal003-entrega.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003EntregaComponent implements Cal003Pestana {
  readonly ctx = inject(Cal003ContextoService);
  readonly clienteColumns = Cal003ClienteColumns;
  readonly bodegaColumns = Cal003BodegaColumns;
  readonly servicioColumns = Cal003ServicioEntregableColumns;
  readonly badge = estadoBadge;
  readonly fecha = fecha;
  readonly hoy = hoy;
  readonly estados = Cal003DeliveryStatus;

  private readonly archivo = viewChild<ElementRef<HTMLInputElement>>('archivo');

  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Cal003Entrega[]>([]);
  readonly currentIndex = signal(-1);
  readonly abierta = signal<Cal003EntregaCompleta | null>(null);

  // Despacho nuevo
  readonly cliente = signal('');
  readonly bodega = signal('');
  readonly candidatos = signal<(Cal003ServicioEntregable & { LABEL: string })[]>([]);
  readonly lineas = signal<Cal003ServicioEntregable[]>([]);
  readonly agregar = signal<number | null>(null);
  readonly seleccionada = signal<number | null>(null);

  // Ventanas
  readonly viewColumns = Cal003EntregaViewColumns;
  readonly viewVisible = signal(false);
  readonly impresionVisible = signal(false);

  readonly creando = computed(() => this.mode() === RecordToolbarMode.Creating);

  /** Cabecera común de la pantalla con la salida abierta (documento SSA y estado del documento). */
  readonly cabecera = computed<Cal003Cabecera | null>(() => {
    const e = this.creando() ? null : this.abierta()?.ENTREGA;
    return e ? { documento: e.DOCUMENTO, estado: e.ESTADO_DOCUMENTO ?? '', usuario: e.USUARIO_CREA, fechaRegistro: e.FECHA_CREA ?? null } : null;
  });

  readonly barra = computed<Cal003EstadoBarra>(() => ({
    mode: this.mode(),
    currentIndex: this.currentIndex(),
    total: this.records().length
  }));

  /** Líneas que se muestran: las del borrador o las del documento abierto. */
  readonly vista = computed<Cal003LineaVista[]>(() => this.creando()
    ? this.lineas().map(l => ({ ...l, ESTADO: 'POR DESPACHAR', OBSERVACION_ANULA: null }))
    : (this.abierta()?.LINEAS ?? []));

  readonly activas = computed(() => this.vista().filter(l => l.ESTADO !== 'ANULADA'));
  readonly lineasSg = computed(() => this.activas().filter(l => l.TIPO_SERVICIO === Cal003ServiceType.Warranty).length);
  readonly lineasSr = computed(() => this.activas().filter(l => l.TIPO_SERVICIO === Cal003ServiceType.Repair).length);

  readonly estado = computed(() => this.creando() ? 'BORRADOR' : this.abierta()?.ENTREGA.ESTADO ?? '');

  async ejecutar(accion: string, payload?: unknown): Promise<void> {
    switch (accion) {
      case ToolbarAction.New: return this.nuevo();
      case ToolbarAction.Save: return this.despachar();
      case ToolbarAction.Cancel: return this.cancelar();
      case ToolbarAction.View: return this.abrirVer();
      case ToolbarAction.Delete: return this.anularLinea();
      case ToolbarAction.Print: return this.verImpresion();
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

  async refrescar(): Promise<void> {
    if (this.creando()) return this.cargarCandidatos();
    if (this.currentIndex() >= 0) await this.abrir(this.currentIndex());
  }

  // ================= Despacho nuevo =================

  nuevo(): void {
    if (!this.ctx.puedeCrear()) return this.ctx.advertir('El despacho lo hace quien gestiona las garantías.');
    this.mode.set(RecordToolbarMode.Creating);
    this.abierta.set(null);
    this.cliente.set('');
    this.bodega.set('');
    this.candidatos.set([]);
    this.lineas.set([]);
    this.seleccionada.set(null);
  }

  async cancelar(): Promise<void> {
    if (this.lineas().length && !(await this.ctx.confirmar('¿Desea descartar el despacho que está armando?', 'Sí, descartar'))) return;
    this.lineas.set([]);
    if (this.records().length) await this.abrir(Math.max(this.currentIndex(), 0));
    else this.mode.set(RecordToolbarMode.Initial);
  }

  async elegirCliente(id: string | null): Promise<void> {
    if ((id ?? '') === this.cliente()) return;
    if (this.lineas().length && !(await this.ctx.confirmar('Al cambiar el cliente se quitan los servicios agregados. ¿Continuar?', 'Sí, cambiar'))) return;
    this.cliente.set(id ?? '');
    this.lineas.set([]);
    await this.cargarCandidatos();
  }

  async elegirBodega(id: string | null): Promise<void> {
    if ((id ?? '') === this.bodega()) return;
    this.bodega.set(id ?? '');
    this.lineas.set([]);
    await this.cargarCandidatos();
  }

  private async cargarCandidatos(): Promise<void> {
    if (!this.cliente() || !this.bodega()) {
      this.candidatos.set([]);
      return;
    }
    const rows = await this.ctx.ejecutar(() => this.ctx.api.serviciosEntregables(this.cliente(), this.bodega()));
    this.candidatos.set((rows ?? []).map(r => ({ ...r, LABEL: `${r.DOCUMENTO} · ${r.NOMBRE} · ${r.TIPO_SERVICIO}${r.OK ? '' : ' (no sale como llegó)'}` })));
  }

  agregarServicio(id: number | null): void {
    this.agregar.set(id);
    if (id === null) return;
    const s = this.candidatos().find(c => c.ID_SERVICIO === id);
    setTimeout(() => this.agregar.set(null));
    if (!s) return;
    if (this.lineas().some(l => l.ID_SERVICIO === id)) return;
    if (!s.OK) {
      this.ctx.advertir(`No puedes agregar ${s.DOCUMENTO}: no sale como llegó desde ${this.ctx.bodega(this.bodega())}. Falta reunir: ${s.MOTIVO}.`);
      return;
    }
    this.lineas.update(list => [...list, s]);
  }

  quitarLinea(id: number): void {
    this.lineas.update(list => list.filter(l => l.ID_SERVICIO !== id));
  }

  async despachar(): Promise<void> {
    if (!this.creando()) return;
    if (!this.cliente()) return this.ctx.advertir('Escoge el cliente.');
    if (!this.bodega()) return this.ctx.advertir('Escoge la bodega de salida.');
    if (!this.lineas().length) return this.ctx.advertir('Agrega al menos un servicio al despacho.');
    const entrega = await this.ctx.ejecutar(() =>
      this.ctx.api.entregaDespachar(this.cliente(), this.bodega(), this.lineas().map(l => l.ID_SERVICIO)));
    if (!entrega) return;
    this.ctx.exito(`${entrega.DOCUMENTO} despachado. Imprímelo para la firma del cliente.`);
    this.lineas.set([]);
    this.records.set([entrega, ...this.records()]);
    await this.abrir(0);
    this.verImpresion();
  }

  // ================= Documento abierto =================

  /** Ver de la barra: la lista de lo que trajo Buscar. */
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
    const encontrados = await this.ctx.ejecutar(() => this.ctx.api.entregas(criterios));
    if (!encontrados) return;
    if (!encontrados.length) {
      this.ctx.advertir('No se encontraron registros con el criterio especificado.');
      return;
    }
    this.records.set(encontrados);
    await this.abrir(0);
    this.ctx.informar(`Se encontraron ${encontrados.length} documento(s) de entrega.`);
  }

  async verRegistro(registro: object): Promise<void> {
    this.viewVisible.set(false);
    const id = (registro as Cal003Entrega)?.ID_ENTREGA;
    const indice = this.records().findIndex(r => r.ID_ENTREGA === id);
    if (indice >= 0) await this.abrir(indice);
  }

  async irA(indice: number): Promise<void> {
    if (this.creando() || indice < 0 || indice >= this.records().length || indice === this.currentIndex()) return;
    await this.abrir(indice);
  }

  private async abrir(indice: number): Promise<void> {
    const registro = this.records()[indice];
    if (!registro) return;
    const completa = await this.ctx.ejecutar(() => this.ctx.api.entrega(registro.ID_ENTREGA));
    if (!completa) return;
    this.records.update(list => list.map((r, i) => i === indice ? completa.ENTREGA : r));
    this.currentIndex.set(indice);
    this.abierta.set(completa);
    this.seleccionada.set(null);
    this.mode.set(RecordToolbarMode.Browsing);
  }

  async anularLinea(): Promise<void> {
    const entrega = this.abierta()?.ENTREGA;
    const linea = this.abierta()?.LINEAS.find(l => l.ID_SERVICIO === this.seleccionada());
    if (!entrega || !linea) return this.ctx.advertir('Selecciona la línea del servicio.');
    if (entrega.ESTADO === Cal003DeliveryStatus.Closed) return this.ctx.advertir(`${entrega.DOCUMENTO} ya está cerrado con su soporte.`);
    if (linea.ESTADO === 'ANULADA') return this.ctx.advertir(`La línea de ${linea.DOCUMENTO} ya está anulada.`);
    const observacion = await this.ctx.pedirObservacion(`Anular línea ${linea.DOCUMENTO}`,
      `<p>Solo se anula esta línea; las demás siguen despachadas, pendientes de soporte. ${linea.DOCUMENTO} vuelve a
       ${entrega.BODEGA} y queda libre para trasladar, ajustar o entrar en otro despacho.</p>`,
      'Anular', 'Por qué el cliente lo devolvió');
    if (!observacion) return;
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.entregaAnularLinea(entrega.ID_ENTREGA, linea.ID_SERVICIO, observacion));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    await this.abrir(this.currentIndex());
  }

  elegirArchivo(): void {
    const entrega = this.abierta()?.ENTREGA;
    if (!entrega || entrega.ESTADO !== Cal003DeliveryStatus.Dispatched) return;
    this.archivo()?.nativeElement.click();
  }

  async adjuntarSoporte(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const entrega = this.abierta()?.ENTREGA;
    if (!file || !entrega) return;
    if (file.size > Cal003Limits.SupportMaxBytes) return this.ctx.advertir('El soporte supera el tamaño máximo de 3 MB.');
    const base64 = await leerBase64(file);
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.soporteAdjuntar(entrega.ID_ENTREGA, file.name, base64));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    await this.abrir(this.currentIndex());
  }

  async verSoporte(): Promise<void> {
    const entrega = this.abierta()?.ENTREGA;
    if (!entrega) return;
    const soporte = await this.ctx.ejecutar(() => this.ctx.api.soporte(entrega.ID_ENTREGA));
    if (!soporte) return;
    const bytes = Uint8Array.from(atob(soporte.BASE64), c => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: soporte.MIME }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ================= Impresión =================

  verImpresion(): void {
    if (!this.activas().length) return this.ctx.advertir('Agrega servicios antes de imprimir.');
    this.impresionVisible.set(true);
  }

  imprimir(): void {
    const contenido = document.getElementById('c3-doc-entrega')?.innerHTML ?? '';
    const ventana = window.open('', '_blank', 'width=900,height=700');
    if (!ventana) return this.ctx.advertir('El navegador bloqueó la ventana de impresión.');
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Documento de entrega</title>
      <style>body{font:13px Roboto,Arial,sans-serif;color:#0a3960;margin:24px}table{width:100%;border-collapse:collapse}
      th,td{padding:6px 8px;border:1px solid #cbd5e1;text-align:left}th{background:#f1f5f9}.firmas{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:56px}
      .firmas div{border-top:1px solid #0a3960;padding-top:4px;text-align:center}</style></head><body>${contenido}</body></html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  }

  /** Saldo pendiente por entregar del producto: en el borrador se descuentan los servicios que ya van en él. */
  saldo(l: Cal003LineaVista): number | null {
    if (l.SALDO == null) return null;
    if (!this.creando()) return l.SALDO;
    return Math.max(l.SALDO - this.lineas().filter(x => x.PRODUCTO === l.PRODUCTO).length, 0);
  }

  bodegaSalida(): string {
    return this.abierta()?.ENTREGA?.BODEGA ?? this.ctx.bodega(this.bodega());
  }

  /** Filas de la línea: PIEZAS del SP; si un SP anterior no las trae, sus unidades una por una. */
  piezas(l: Cal003LineaVista): Cal003Pieza[] {
    if (l.PIEZAS?.length) return l.PIEZAS;
    return (l.UNIDADES ?? []).map(u => ({
      NOMBRE: u.NOMBRE_PARTE ? `${u.NOMBRE_PRODUCTO} · ${u.NOMBRE_PARTE}` : u.NOMBRE_PRODUCTO,
      CANTIDAD: u.CANTIDAD
    }));
  }

  nombreCliente(): string {
    return this.abierta()?.ENTREGA.NOMBRE_CLIENTE ?? this.ctx.clientes().find(c => c.ID_CLIENTE === this.cliente())?.NOMBRE ?? '';
  }
}

function leerBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result ?? ''));
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(file);
  });
}
