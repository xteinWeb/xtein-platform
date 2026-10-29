import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DxTemplateModule } from 'devextreme-angular/core';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { SessionService } from '@xtein/session';
import { RecordToolbarMode, ToolbarAction } from '@xtein/sdk';
import {
  XteinCheckboxComponent,
  XteinDataGridComponent,
  XteinDateComponent,
  XteinGridToolbarAction,
  XteinGroupLabelComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLookupComponent,
  XteinButtonComponent,
  XteinNumberComponent,
  XteinPopupComponent,
  XteinRecordFilterCriterion,
  XteinRecordViewComponent,
  XteinSelectComponent
} from '@xtein/ui';
import { Cal003Limits, Cal003ServiceStatus } from '../../constants/cal-003.constants';
import { Cal003BodegaColumns, Cal003ClienteColumns, Cal003EntradaViewColumns, Cal003ProductoColumns } from '../../constants/cal-003-ui.constants';
import type { Cal003Cabecera, Cal003ProductoLista, Cal003Servicio, Cal003ServicioCompleto } from '../../models/cal-003.model';
import { Cal003ContextoService, Cal003EstadoBarra, Cal003Pestana } from '../../services/cal-003-contexto.service';
import {
  Cal003GrupoEntrada,
  cambiarCantidad,
  crearGrupo,
  esParcial,
  lleganDe,
  marcarLlega,
  unidadesEntrada
} from '../../utils/cal-003-arbol';
import { diasEntrega, estadoBadge, fecha, hoy, resumenEntrega } from '../../utils/cal-003-formato';
import { XteinCal003NcComponent } from '../xtein-cal003-nc/xtein-cal003-nc.component';

/**
 * Entrada: registra lo que llegó del cliente. Cada producto agregado queda como un servicio S.
 * Una entrada guardada no se edita: solo se anula (desde el buscador).
 */
@Component({
  selector: 'xtein-cal003-entrada',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DxDropDownBoxModule,
    DxTemplateModule,
    XteinCheckboxComponent,
    XteinDataGridComponent,
    XteinDateComponent,
    XteinGroupLabelComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLookupComponent,
    XteinButtonComponent,
    XteinNumberComponent,
    XteinPopupComponent,
    XteinRecordViewComponent,
    XteinSelectComponent,
    XteinCal003NcComponent
  ],
  templateUrl: './xtein-cal003-entrada.component.html',
  styleUrl: './xtein-cal003-entrada.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003EntradaComponent implements Cal003Pestana, OnInit, OnDestroy {
  readonly ctx = inject(Cal003ContextoService);
  private readonly session = inject(SessionService);

  readonly clienteColumns = Cal003ClienteColumns;
  readonly bodegaColumns = Cal003BodegaColumns;
  readonly productoColumns = Cal003ProductoColumns;
  readonly limits = Cal003Limits;
  readonly fecha = fecha;
  readonly badge = estadoBadge;
  readonly diasEntrega = diasEntrega;
  readonly hoy = hoy;

  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Cal003Servicio[]>([]);
  readonly currentIndex = signal(-1);
  /** Servicio abierto (solo lectura) con sus unidades. */
  readonly abierto = signal<Cal003ServicioCompleto | null>(null);
  /** Productos agregados a la entrada nueva. */
  readonly grupos = signal<Cal003GrupoEntrada[]>([]);
  /** Filas padre recogidas (clave raíz|fila): sus hijos no se muestran. Por defecto todo está desplegado. */
  readonly recogidos = signal<ReadonlySet<string>>(new Set());
  readonly buscandoProducto = signal(false);

  // Lista de productos (como la de materiales de PRO-039): + abre una fila con la lista para elegir.
  readonly productos = signal<Cal003ProductoLista[]>([]);
  readonly productosCargando = signal(false);
  readonly agregando = signal(false);
  productDropdownOpened = false;
  readonly productDropDownOptions = {
    width: 'min(820px, 95vw)',
    height: 'min(440px, 70dvh)',
    hideOnParentScroll: true
  };

  // Ver de la barra (Buscar lo maneja la pantalla: un solo buscador con el campo Operación)
  readonly viewColumns = Cal003EntradaViewColumns;
  readonly viewVisible = signal(false);
  /** Lo que muestra Ver: cada entrada con su fecha de entrega y semáforo en texto. */
  readonly viewRecords = computed(() => this.records().map(r => ({ ...r, ENTREGA: resumenEntrega(r) })));

  /** Reprogramar la fecha de entrega: solo mientras el servicio espera en DEPOSITO. */
  readonly puedeReprogramar = computed(() => {
    const s = this.mode() === RecordToolbarMode.Browsing ? this.abierto()?.SERVICIO : null;
    return !!s && s.ESTADO === Cal003ServiceStatus.Deposit && this.ctx.puedeCrear();
  });
  readonly reprogramarVisible = signal(false);
  readonly nuevaFechaEntrega = signal<string | null>(null);
  readonly motivoReprogramar = signal('');

  readonly creando = computed(() => this.mode() === RecordToolbarMode.Creating);

  /** No conformidad obligatoria: se abre al guardar la entrada y con el botón de una entrada que no la tiene. */
  readonly ncVisible = signal(false);
  /** La entrada abierta no tiene su no conformidad (y no está anulada). */
  readonly faltaNc = computed(() => {
    const s = this.mode() === RecordToolbarMode.Browsing ? this.abierto()?.SERVICIO : null;
    return !!s && !s.ID_REGISTRO_NC && s.ESTADO !== 'ANULADO';
  });

  /** Cabecera común de la pantalla con la entrada abierta (documento SEN, estado del documento, quién y cuándo). */
  readonly cabecera = computed<Cal003Cabecera | null>(() => {
    const s = this.mode() === RecordToolbarMode.Browsing ? this.abierto()?.SERVICIO : null;
    return s ? { documento: s.DOCUMENTO, estado: s.ESTADO_DOCUMENTO ?? (s.ESTADO === 'ANULADO' ? 'ANULADO' : 'REGISTRADO'),
                 usuario: s.USUARIO_CREA, fechaRegistro: s.FECHA_REGISTRO } : null;
  });

  readonly barra = computed<Cal003EstadoBarra>(() => ({
    mode: this.mode(),
    currentIndex: this.currentIndex(),
    total: this.records().length
  }));

  readonly form = new FormGroup({
    FECHA: new FormControl<string | null>(hoy()),
    FECHA_REGISTRO: new FormControl<string | null>(hoy()),
    FECHA_ENTREGA: new FormControl<string | null>(null),
    ID_CLIENTE: new FormControl<string>(''),
    TIPO_SERVICIO: new FormControl<string>(''),
    ID_UN_BODEGA: new FormControl<string>(''),
    N_SERVICIO_CLIENTE: new FormControl<string>(''),
    N_ORDEN_DEVOLUCION: new FormControl<string>(''),
    ID_AREA: new FormControl<string>(''),
    NUMERO: new FormControl<string>(''),
    USUARIO: new FormControl<string>('')
  });

  private readonly subs = new Subscription();

  ngOnInit(): void {
    this.form.disable({ emitEvent: false });
    this.limpiar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ================= Barra =================

  async ejecutar(accion: string, payload?: unknown): Promise<void> {
    switch (accion) {
      case ToolbarAction.New: return this.nueva();
      case ToolbarAction.Save: return this.guardar();
      case ToolbarAction.Cancel: return this.cancelar();
      case ToolbarAction.View: return this.abrirVer();
      case ToolbarAction.Delete: return this.anular();
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
    const actual = this.records()[this.currentIndex()];
    if (actual) await this.abrir(this.currentIndex());
  }

  // ================= Entrada nueva =================

  async nueva(): Promise<void> {
    if (!this.ctx.puedeCrear()) {
      this.ctx.advertir('La entrada la registra quien gestiona las garantías.');
      return;
    }
    this.mode.set(RecordToolbarMode.Creating);
    this.abierto.set(null);
    this.grupos.set([]);
    this.recogidos.set(new Set());
    this.agregando.set(false);
    this.limpiar();
    this.form.enable({ emitEvent: false });
    this.form.controls.FECHA_REGISTRO.disable({ emitEvent: false });
    this.form.controls.NUMERO.disable({ emitEvent: false });
    this.form.controls.USUARIO.disable({ emitEvent: false });
    if (!this.productos().length) void this.cargarProductos();
  }

  async cancelar(): Promise<void> {
    if (this.grupos().length > 0 && !(await this.ctx.confirmar('¿Desea descartar la entrada que está registrando?', 'Sí, descartar'))) return;
    this.form.disable({ emitEvent: false });
    this.grupos.set([]);
    this.cancelAdd();
    if (this.records().length > 0) {
      await this.abrir(Math.max(this.currentIndex(), 0));
    } else {
      this.mode.set(RecordToolbarMode.Initial);
      this.limpiar();
    }
  }

  async cargarProductos(): Promise<void> {
    this.productosCargando.set(true);
    try {
      this.productos.set(await this.ctx.api.productos());
    } catch (error) {
      this.ctx.error(error);
    } finally {
      this.productosCargando.set(false);
    }
  }

  beginAdd(): void {
    if (!this.creando() || this.buscandoProducto() || this.grupos().length > 0) return;
    this.agregando.set(true);
    // La lista se abre sola al aparecer la fila nueva
    setTimeout(() => this.productDropdownOpened = true);
  }

  cancelAdd(): void {
    this.productDropdownOpened = false;
    this.agregando.set(false);
  }

  selectProductFromDropdown(data: Cal003ProductoLista): void {
    const producto = String(data?.PRODUCTO ?? '');
    if (!producto) return;
    this.cancelAdd();
    void this.agregarProducto(producto);
  }

  productToolbarActions(): XteinGridToolbarAction[] {
    return [
      {
        id: 'refresh',
        icon: 'refresh',
        title: 'Refrescar productos',
        variant: 'secondary',
        disabled: this.productosCargando(),
        action: () => void this.cargarProductos()
      }
    ];
  }

  /** Agrega el árbol del producto elegido (juego → productos → partes). */
  async agregarProducto(codigo: string): Promise<void> {
    if (!codigo || !this.creando() || this.buscandoProducto()) return;
    this.buscandoProducto.set(true);
    try {
      const arbol = await this.ctx.api.arbolProducto(codigo);
      // Una entrada = un producto (un servicio S)
      if (this.grupos().length > 0) {
        this.ctx.advertir('La entrada lleva un solo producto: quita el que está para cambiarlo.');
      } else {
        this.grupos.set([crearGrupo(arbol)]);
      }
    } catch (error) {
      this.ctx.error(error);
    } finally {
      this.buscandoProducto.set(false);
    }
  }

  quitarProducto(indice: number): void {
    this.grupos.update(list => list.filter((_, i) => i !== indice));
  }

  marcar(grupo: number, fila: number, llega: boolean): void {
    this.grupos.update(list => list.map((g, i) => i === grupo ? marcarLlega(g, fila, llega) : g));
  }

  cantidad(grupo: number, fila: number, valor: number | null): void {
    this.grupos.update(list => list.map((g, i) => i === grupo ? cambiarCantidad(g, fila, Number(valor ?? 0)) : g));
  }

  parcial(grupo: Cal003GrupoEntrada): boolean {
    return esParcial(grupo);
  }

  // ================= Desplegar / recoger el árbol =================

  recogido(grupo: Cal003GrupoEntrada, fila: number): boolean {
    return this.recogidos().has(`${grupo.raiz}|${fila}`);
  }

  /** Una fila se ve si ninguno de sus ancestros (juego o producto) está recogido. */
  visible(grupo: Cal003GrupoEntrada, fila: number): boolean {
    for (let padre = grupo.filas[fila]?.padre ?? -1; padre >= 0; padre = grupo.filas[padre].padre) {
      if (this.recogido(grupo, padre)) return false;
    }
    return true;
  }

  alternar(grupo: Cal003GrupoEntrada, fila: number): void {
    const clave = `${grupo.raiz}|${fila}`;
    this.recogidos.update(actual => {
      const nuevo = new Set(actual);
      if (!nuevo.delete(clave)) nuevo.add(clave);
      return nuevo;
    });
  }

  desplegarTodo(): void {
    this.recogidos.set(new Set());
  }

  recogerTodo(): void {
    this.recogidos.set(new Set(this.grupos().flatMap(g =>
      g.filas.flatMap((f, i) => f.hijos.length ? [`${g.raiz}|${i}`] : []))));
  }

  async guardar(): Promise<void> {
    if (!this.creando()) return;
    const v = this.form.getRawValue();
    const vivos = this.grupos().filter(g => lleganDe(g).length > 0);
    const faltan: string[] = [];
    if (!v.FECHA) faltan.push('fecha');
    if (!v.FECHA_ENTREGA) faltan.push('fecha de entrega');
    if (!v.ID_CLIENTE) faltan.push('cliente');
    if (!v.TIPO_SERVICIO) faltan.push('tipo de servicio (SG o SR)');
    if (!v.ID_UN_BODEGA) faltan.push('bodega');
    if (!vivos.length) faltan.push('al menos un producto con cantidad');
    if (faltan.length) {
      this.ctx.advertir(`Falta: ${faltan.join(', ')}.`);
      return;
    }
    if (String(v.FECHA_ENTREGA).slice(0, 10) < String(v.FECHA).slice(0, 10)) {
      this.ctx.advertir('La fecha de entrega no puede ser anterior a la fecha de la entrada.');
      return;
    }
    const numero = (v.N_SERVICIO_CLIENTE ?? '').trim();
    if (!numero) {
      this.ctx.advertir('Falta el número de servicio del cliente: lo pide la no conformidad.');
      return;
    }
    if (!/^\d+$/.test(numero)) {
      this.ctx.advertir('El número de servicio debe ser solo numérico.');
      return;
    }
    // Las partes empiezan en cero: no se guarda si todo lo marcado sigue en cero.
    if (vivos.every(g => unidadesEntrada(g).UNIDADES.every(u => !u.CANTIDAD))) {
      this.ctx.advertir('Las cantidades están todas en cero: escribe la cantidad de lo que llegó.');
      return;
    }

    const creados = await this.ctx.ejecutar(() => this.ctx.api.entradaNueva({
      FECHA: String(v.FECHA).slice(0, 10),
      FECHA_ENTREGA: String(v.FECHA_ENTREGA).slice(0, 10),
      ID_CLIENTE: v.ID_CLIENTE ?? '',
      TIPO_SERVICIO: v.TIPO_SERVICIO ?? '',
      ID_UN_BODEGA: v.ID_UN_BODEGA ?? '',
      N_SERVICIO_CLIENTE: (v.N_SERVICIO_CLIENTE ?? '').trim(),
      N_ORDEN_DEVOLUCION: (v.N_ORDEN_DEVOLUCION ?? '').trim(),
      ID_AREA: v.ID_AREA ?? ''
    }, vivos.map(unidadesEntrada)));
    if (!creados) return;

    this.ctx.exito(`Entrada guardada: ${creados.map(c => c.DOCUMENTO).join(', ')}. Ahora registra su no conformidad.`);
    this.grupos.set([]);
    this.form.disable({ emitEvent: false });
    const servicios = await this.ctx.ejecutar(() => Promise.all(creados.map(c => this.ctx.api.servicio(c.ID_SERVICIO))));
    this.records.set((servicios ?? []).map(s => s.SERVICIO));
    if (this.records().length) {
      await this.abrir(0);
      // La no conformidad es obligatoria: se pide en seguida
      if (this.faltaNc()) this.ncVisible.set(true);
    } else this.mode.set(RecordToolbarMode.Initial);
  }

  registrarNc(): void {
    if (this.faltaNc()) this.ncVisible.set(true);
  }

  async ncRegistrada(): Promise<void> {
    this.ncVisible.set(false);
    await this.abrir(this.currentIndex());
  }

  // ================= Fecha de entrega =================

  abrirReprogramar(): void {
    const s = this.abierto()?.SERVICIO;
    if (!s || !this.puedeReprogramar()) return;
    this.nuevaFechaEntrega.set(s.FECHA_ENTREGA?.slice(0, 10) ?? null);
    this.motivoReprogramar.set('');
    this.reprogramarVisible.set(true);
  }

  async reprogramar(): Promise<void> {
    const s = this.abierto()?.SERVICIO;
    if (!s) return;
    const nueva = this.nuevaFechaEntrega() ? String(this.nuevaFechaEntrega()).slice(0, 10) : '';
    const motivo = this.motivoReprogramar().trim();
    const faltan: string[] = [];
    if (!nueva) faltan.push('nueva fecha de entrega');
    if (!motivo) faltan.push('motivo');
    if (faltan.length) {
      this.ctx.advertir(`Falta: ${faltan.join(', ')}.`);
      return;
    }
    if (nueva < hoy()) {
      this.ctx.advertir('La nueva fecha de entrega no puede ser anterior a hoy.');
      return;
    }
    if (nueva === s.FECHA_ENTREGA?.slice(0, 10)) {
      this.ctx.advertir('La nueva fecha de entrega es la misma que ya tiene.');
      return;
    }
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.entradaReprogramar(s.ID_SERVICIO, s.VERSION, nueva, motivo));
    if (!resultado) return;
    this.reprogramarVisible.set(false);
    this.ctx.exito(resultado.MENSAJE);
    await this.abrir(this.currentIndex());
  }

  // ================= Buscador, navegación y anulación =================

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
    const encontrados = await this.ctx.ejecutar(() => this.ctx.api.buscarServicios(criterios));
    if (!encontrados) return;
    if (!encontrados.length) {
      this.ctx.advertir('No se encontraron registros con el criterio especificado.');
      return;
    }
    this.records.set(encontrados);
    await this.abrir(0);
    this.ctx.informar(`Se encontraron ${encontrados.length} entrada(s).`);
  }

  async verRegistro(registro: object): Promise<void> {
    this.viewVisible.set(false);
    const id = (registro as Cal003Servicio)?.ID_SERVICIO;
    const indice = this.records().findIndex(r => r.ID_SERVICIO === id);
    if (indice >= 0) await this.abrir(indice);
  }

  async irA(indice: number): Promise<void> {
    if (this.creando() || indice < 0 || indice >= this.records().length || indice === this.currentIndex()) return;
    await this.abrir(indice);
  }

  private async abrir(indice: number): Promise<void> {
    const registro = this.records()[indice];
    if (!registro) return;
    const completo = await this.ctx.ejecutar(() => this.ctx.api.servicio(registro.ID_SERVICIO));
    if (!completo) return;
    this.records.update(list => list.map((r, i) => i === indice ? completo.SERVICIO : r));
    this.currentIndex.set(indice);
    this.abierto.set(completo);
    this.mode.set(RecordToolbarMode.Browsing);
    const s = completo.SERVICIO;
    this.form.reset({
      FECHA: s.FECHA?.slice(0, 10) ?? null,
      FECHA_REGISTRO: s.FECHA_REGISTRO?.slice(0, 10) ?? null,
      FECHA_ENTREGA: s.FECHA_ENTREGA?.slice(0, 10) ?? null,
      ID_CLIENTE: s.ID_CLIENTE,
      TIPO_SERVICIO: s.TIPO_SERVICIO,
      ID_UN_BODEGA: s.ID_UN_BODEGA_ENTRADA,
      N_SERVICIO_CLIENTE: s.N_SERVICIO_CLIENTE ?? '',
      N_ORDEN_DEVOLUCION: s.N_ORDEN_DEVOLUCION ?? '',
      ID_AREA: s.ID_AREA ?? '',
      NUMERO: s.DOCUMENTO,
      USUARIO: s.USUARIO_CREA
    }, { emitEvent: false });
    this.form.disable({ emitEvent: false });
  }

  async anular(): Promise<void> {
    const actual = this.abierto()?.SERVICIO;
    if (!actual || this.creando()) {
      this.ctx.advertir('Para anular, busca la entrada con Buscar en la barra de acciones y ábrela.');
      return;
    }
    if (actual.ESTADO === Cal003ServiceStatus.Voided) {
      this.ctx.advertir(`${actual.DOCUMENTO} ya está anulado.`);
      return;
    }
    const inactivo = actual.ESTADO === Cal003ServiceStatus.Inactive;
    const html = inactivo
      ? `<p>${actual.DOCUMENTO} está INACTIVO. Si ya reuniste sus partes en una sola bodega, se anula completo.</p>`
      : `<p>La entrada queda en el historial con su número, quién, cuándo y por qué. Si tiene un traslado REGISTRADO sin autorizar, se anula también y sale de Autorizaciones.</p>
         <p>Si ya tiene traslados autorizados, solo la persona de facturación puede anularla: queda <b>INACTIVO</b> hasta reunir sus partes.</p>`;
    const observacion = await this.ctx.pedirObservacion(`Anular ${actual.DOCUMENTO}`, html, 'Anular');
    if (!observacion) return;
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.entradaAnular(actual.ID_SERVICIO, actual.VERSION, observacion));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    await this.abrir(this.currentIndex());
  }

  // ================= Utilidades =================

  nombreBodega(id: string | null | undefined): string {
    return this.ctx.bodega(id);
  }

  private limpiar(): void {
    const bodegas = this.ctx.bodegas();
    this.form.reset({
      FECHA: hoy(),
      FECHA_REGISTRO: hoy(),
      // La escribe quien registra: es el compromiso con el cliente
      FECHA_ENTREGA: null,
      ID_CLIENTE: '',
      TIPO_SERVICIO: '',
      ID_UN_BODEGA: bodegas.length === 1 ? bodegas[0].ID_UN_BODEGA : '',
      N_SERVICIO_CLIENTE: '',
      N_ORDEN_DEVOLUCION: '',
      ID_AREA: '',
      NUMERO: '',
      USUARIO: this.session.current?.userId ?? ''
    }, { emitEvent: false });
  }
}
