import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal, untracked, viewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { RecordToolbarMode, ToolbarAction, ToolbarCommand, createRecordToolbarState } from '@xtein/sdk';
import { ToolbarRuntimeService, WorkspaceRuntimeService } from '@xtein/runtime';
import { SessionService } from '@xtein/session';
import { XteinNotificationService } from '@xtein/ui';
import { XteinCal001BuscadorComponent, type Cal001OpcionBusqueda } from './components/xtein-cal001-buscador/xtein-cal001-buscador.component';
import { XteinCal001CausaSelectorComponent } from './components/xtein-cal001-causa-selector/xtein-cal001-causa-selector.component';
import { XteinCal001ConsultaComponent } from './components/xtein-cal001-consulta/xtein-cal001-consulta.component';
import { XteinCal001DetalleParteComponent } from './components/xtein-cal001-detalle-parte/xtein-cal001-detalle-parte.component';
import { XteinCal001FotosComponent } from './components/xtein-cal001-fotos/xtein-cal001-fotos.component';
import { XteinCal001HistorialComponent } from './components/xtein-cal001-historial/xtein-cal001-historial.component';
import { XteinCal001NcOperarioComponent } from './components/xtein-cal001-nc-operario/xtein-cal001-nc-operario.component';
import { XteinCal001PartesComponent } from './components/xtein-cal001-partes/xtein-cal001-partes.component';
import { Cal001Application, Cal001Limits, Cal001Origen } from './constants/cal-001.constants';
import { Cal001ToolbarCapabilities, permisosBarra } from './constants/cal-001-ui.constants';
import type {
  Cal001Borrador, Cal001Causa, Cal001Cliente, Cal001ConsultaFila, Cal001ConsultaFiltro, Cal001ConsultaResultado,
  Cal001ListasCliente, Cal001Operario, Cal001ParteBorrador, Cal001PartesProducto, Cal001Permisos, Cal001Producto,
  Cal001RegistroCompleto, Cal001ValorLista
} from './models/cal-001.model';
import { Cal001ExcelService } from './services/cal-001-excel.service';
import { Cal001Service } from './services/cal-001.service';
import { ncPorOperario, filasExportacion } from './utils/cal-001-agrupado';
import { Cal001AlmacenBorrador, claveBorrador } from './utils/cal-001-borrador';
import { mensajeError } from './utils/cal-001-errores';
import { hoyColombia, mostrarFecha, sumarDias } from './utils/cal-001-fecha';
import { borradorDesdeRegistro, borradorVacio, clonarBorrador, partesDesdeProducto, tieneCaptura } from './utils/cal-001-modelo';
import { validarBorrador } from './utils/cal-001-validaciones';

type Cal001Pestana = 'registro' | 'consulta';
type CampoEncabezado = 'ORIGEN' | 'CANTIDAD_REFERENCIA' | 'FECHA_EVENTO' | 'OBSERVACION' | 'N_SERVICIO' | 'ID_AREA_DETECCION'
  | 'FUENTE' | 'FECHA_RECLAMO' | 'MOTIVO';

/**
 * CAL-001 - No Conformidades.
 * Pestaña "No conformidad" (producto → partes → no conformidades → operarios con ocurrencias, garantía de Cliente,
 * evidencia, historial) y pestaña "Consulta" (todos los registros, exportación por operario y causa).
 * Contrato: apiRest/docs/contratos/cal-001-spNoConformidad.md.
 */
@Component({
  selector: 'xtein-cal-001',
  standalone: true,
  imports: [
    XteinCal001BuscadorComponent, XteinCal001CausaSelectorComponent, XteinCal001ConsultaComponent, XteinCal001DetalleParteComponent,
    XteinCal001FotosComponent, XteinCal001HistorialComponent, XteinCal001NcOperarioComponent, XteinCal001PartesComponent
  ],
  providers: [Cal001Service],
  templateUrl: './cal-001.component.html',
  styleUrl: './cal-001.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Cal001Component implements OnInit, OnDestroy {
  private readonly servicio = inject(Cal001Service);
  private readonly excel = inject(Cal001ExcelService);
  private readonly toolbar = inject(ToolbarRuntimeService);
  private readonly workspace = inject(WorkspaceRuntimeService);
  private readonly session = inject(SessionService);
  private readonly notification = inject(XteinNotificationService);
  private readonly subscriptions = new Subscription();
  private readonly almacen = new Cal001AlmacenBorrador();
  private readonly fotosComponente = viewChild(XteinCal001FotosComponent);
  private temporizadorBorrador: ReturnType<typeof setTimeout> | null = null;
  private version = 0;

  readonly applicationId = Cal001Application.Id;
  readonly origenes = Cal001Origen;
  readonly limites = Cal001Limits;
  readonly fecha = mostrarFecha;

  readonly cargando = signal(false);
  readonly pestana = signal<Cal001Pestana>('registro');
  readonly modo = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly permisos = signal<Cal001Permisos | null>(null);
  readonly errores = signal<string[]>([]);
  readonly registro = signal<Cal001RegistroCompleto | null>(null);
  readonly borrador = signal<Cal001Borrador | null>(null);
  readonly parteSeleccionada = signal<string | null>(null);
  readonly causas = signal<Cal001Causa[]>([]);
  readonly listas = signal<Cal001ListasCliente | null>(null);
  readonly borradorGuardadoEn = signal<string>('');
  private partesRegistro: Cal001PartesProducto | null = null;
  readonly cargandoProducto = signal(false);
  /** Fotos en cola sin subir: la pestaña queda marcada como sucia (aviso al salir). */
  readonly fotosPendientes = signal(false);
  private versionProducto = 0;
  private versionExportacion = 0;

  readonly filtro = signal<Cal001ConsultaFiltro>(this.filtroInicial());
  readonly consulta = signal<Cal001ConsultaResultado | null>(null);
  readonly consultando = signal(false);
  readonly exportando = signal('');
  /** Registros por los que navega la barra (página actual de la consulta). */
  readonly registros = signal<Cal001ConsultaFila[]>([]);

  readonly usuario = computed(() => this.session.session()?.userId ?? '');
  readonly claveBorrador = computed(() => {
    const sesion = this.session.session();
    return sesion ? claveBorrador(sesion.companyId, sesion.userId) : null;
  });
  readonly esGestor = computed(() => Number(this.permisos()?.ES_GESTOR) === 1);
  readonly puedeCrear = computed(() => Number(this.permisos()?.PUEDE_CREAR) === 1);
  readonly creando = computed(() => this.modo() === RecordToolbarMode.Creating);
  readonly modificando = computed(() => this.modo() === RecordToolbarMode.Editing);
  /** Solo se edita al crear o al modificar (gestor); todo registro guardado se abre en solo lectura (historia 3). */
  readonly editable = computed(() => this.creando() || this.modificando());
  readonly esCliente = computed(() => this.borrador()?.ORIGEN === Cal001Origen.Cliente);
  /** Cliente solo para el gestor (historia 6); un registro Cliente ya guardado se muestra igual. */
  readonly permiteCliente = computed(() => this.esGestor() || this.esCliente());
  readonly causasProduccion = computed(() => this.causas().filter(c => c.TIPO === 'PRODUCCION'));
  readonly causasCliente = computed(() => this.causas().filter(c => c.TIPO === 'CLIENTE'));
  readonly parteActual = computed<Cal001ParteBorrador | null>(() => {
    const partes = this.borrador()?.PARTES ?? [];
    return partes.find(p => p.CLAVE === this.parteSeleccionada()) ?? partes[0] ?? null;
  });
  readonly ncOperario = computed(() => ncPorOperario(this.borrador() ?? { PARTES: [] }));
  readonly indiceActual = computed(() => {
    const id = this.registro()?.REGISTRO.ID_REGISTRO_NC;
    return id ? this.registros().findIndex(r => r.ID_REGISTRO_NC === id) : -1;
  });
  readonly productoActual = computed(() => {
    const b = this.borrador();
    return b?.PRODUCTO ? `${b.PRODUCTO} · ${b.NOMBRE_PRODUCTO}` : '';
  });
  readonly clienteActual = computed(() => {
    const b = this.borrador();
    return b?.ID_CLIENTE ? `${b.ID_CLIENTE} · ${b.NOMBRE_CLIENTE}` : '';
  });
  readonly areas = computed(() => this.opcionesLista(this.listas()?.AREAS_DETECCION ?? [], this.borrador()?.ID_AREA_DETECCION));
  readonly fuentes = computed(() => this.opcionesLista(this.listas()?.FUENTES ?? [], this.borrador()?.FUENTE));
  readonly puedeAgregarFotos = computed(() => this.editable() || Number(this.registro()?.PUEDE_AGREGAR_FOTOS) === 1);
  readonly puedeRetirarFotos = computed(() => !this.creando() && Number(this.registro()?.PUEDE_RETIRAR_FOTOS) === 1);
  readonly modoTexto = computed(() => {
    const r = this.registro()?.REGISTRO;
    if (this.creando()) return 'Registro nuevo: elija origen, producto, partes, no conformidades y operarios; luego Guardar. El documento se asigna al guardar.';
    if (this.modificando() && r) return `Modificando ${r.DOCUMENTO} como gestor de calidad. Al guardar se anota su usuario con fecha y hora; el registro sigue a nombre de ${r.USUARIO_CREA}.`;
    if (r) {
      return `Consultando ${r.DOCUMENTO}, registrado por ${r.USUARIO_CREA}. ` + (this.esGestor()
        ? 'Para corregirlo use Modificar en la barra. Los registros no se anulan; se corrigen.'
        : 'Solo lectura: solo el gestor de calidad modifica registros.');
    }
    return this.puedeCrear() ? 'Use Nuevo para registrar una no conformidad o abra un registro desde Consulta.' : 'Abra un registro desde Consulta.';
  });

  readonly buscarProductos = (texto: string): Promise<Cal001OpcionBusqueda<Cal001Producto>[]> =>
    this.servicio.productos(texto).then(lista => lista.map(p => ({
      valor: p, codigo: p.PRODUCTO, nombre: Number(p.SIN_PARTES) === 1 ? `${p.NOMBRE} (sin partes)` : p.NOMBRE
    })));
  readonly buscarOperarios = (texto: string): Promise<Cal001OpcionBusqueda<Cal001Operario>[]> =>
    this.servicio.operarios(texto).then(lista => lista.map(o => ({
      valor: o, codigo: o.ID_EMPLEADO,
      nombre: o.SECCIONES.length ? `${o.NOMBRE} · ${o.SECCIONES.map(s => s.DESCRIPCION).join(', ')}` : `${o.NOMBRE} · sin sección activa`
    })));
  readonly buscarClientes = (texto: string): Promise<Cal001OpcionBusqueda<Cal001Cliente>[]> =>
    this.servicio.clientes(texto).then(lista => lista.map(c => ({ valor: c, codigo: c.ID_CLIENTE, nombre: c.NOMBRE })));

  constructor() {
    effect(() => this.publicarBarra());
    effect(() => {
      const pendientes = this.fotosPendientes();
      const editable = this.editable();
      untracked(() => {
        if (pendientes) this.workspace.setDirty(this.applicationId, true);
        else if (!editable) this.workspace.setDirty(this.applicationId, false);
      });
    });
    // Borradores de otro usuario o de una sesión cerrada se borran al instante (plan C15).
    effect(() => {
      const clave = this.claveBorrador();
      untracked(() => this.almacen.borrarAjenos(clave));
    });
    // El registro nuevo se guarda en este equipo mientras se captura.
    effect(() => {
      const borrador = this.borrador();
      const clave = this.claveBorrador();
      if (!this.creando() || !borrador) return;
      untracked(() => this.programarBorrador(clave, borrador));
    });
  }

  ngOnInit(): void {
    this.subscriptions.add(this.toolbar.commandsForApplication(this.applicationId).subscribe(comando => this.comando(comando)));
    void this.iniciar();
  }

  ngOnDestroy(): void {
    this.version++;
    if (this.temporizadorBorrador) clearTimeout(this.temporizadorBorrador);
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  private async iniciar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [permisos, causas] = await Promise.all([this.servicio.permisos(), this.servicio.causas()]);
      this.permisos.set(permisos);
      this.causas.set(causas);
    } catch (error) {
      this.permisos.set(null);
      this.errores.set([mensajeError(error).mensaje]);
      this.avisar(error);
      return;
    } finally {
      this.cargando.set(false);
    }
    await this.ofrecerBorrador();
  }

  /** Si quedó un registro nuevo sin guardar en este equipo, se ofrece recuperarlo. */
  private async ofrecerBorrador(): Promise<void> {
    const clave = this.claveBorrador();
    const guardado = this.almacen.leer(clave);
    if (!guardado) return;
    // Sin permiso de crear no se ofrece: el borrador se descarta para que no quede en el equipo.
    if (!this.puedeCrear()) {
      this.almacen.borrar(clave);
      return;
    }
    const respuesta = await Swal.fire({
      title: 'Borrador sin guardar',
      text: `Hay un registro nuevo sin guardar en este equipo (guardado el ${new Date(guardado.GUARDADO_EN).toLocaleString('es-CO')}). ¿Desea recuperarlo?`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#0A3960', cancelButtonColor: '#8a99a8',
      confirmButtonText: 'Recuperar', cancelButtonText: 'Descartar'
    });
    if (!respuesta.isConfirmed) {
      this.almacen.borrar(clave);
      return;
    }
    const borrador = { ...guardado.BORRADOR, ID_REGISTRO_NC: null, VERSION: null, DOCUMENTO: '' };
    if (borrador.ORIGEN === Cal001Origen.Cliente && !this.esGestor()) borrador.ORIGEN = Cal001Origen.Produccion;
    this.empezarCaptura(borrador);
    if (borrador.ORIGEN === Cal001Origen.Cliente) void this.cargarListas();
  }

  private programarBorrador(clave: string | null, borrador: Cal001Borrador): void {
    if (this.temporizadorBorrador) clearTimeout(this.temporizadorBorrador);
    this.temporizadorBorrador = setTimeout(() => {
      if (this.creando() && this.almacen.guardar(clave, borrador)) this.borradorGuardadoEn.set(new Date().toLocaleTimeString('es-CO'));
    }, 500);
  }

  /* ============================ Barra de registro ============================ */

  private publicarBarra(): void {
    const estado = createRecordToolbarState({
      applicationId: this.applicationId,
      mode: this.modo(),
      permissions: permisosBarra(this.permisos()),
      capabilities: { ...Cal001ToolbarCapabilities, edit: Number(this.registro()?.PUEDE_MODIFICAR) === 1 },
      currentIndex: Math.max(0, this.indiceActual()),
      totalRecords: this.registro() ? this.registros().length : 0
    });
    untracked(() => this.toolbar.setState(estado));
  }

  private comando(comando: ToolbarCommand): void {
    if (this.cargando()) return;
    switch (comando.action) {
      case ToolbarAction.New: this.nuevo(); break;
      case ToolbarAction.Edit: this.modificar(); break;
      case ToolbarAction.Save: void this.guardar(); break;
      case ToolbarAction.Cancel: void this.cancelar(); break;
      case ToolbarAction.Search: this.irAConsulta(); break;
      case ToolbarAction.Refresh: void this.refrescar(); break;
      case ToolbarAction.First: this.navegar(0); break;
      case ToolbarAction.Previous: this.navegar(this.indiceActual() - 1); break;
      case ToolbarAction.Next: this.navegar(this.indiceActual() + 1); break;
      case ToolbarAction.Last: this.navegar(this.registros().length - 1); break;
      case ToolbarAction.GoTo:
        if (typeof comando.payload === 'number' && Number.isInteger(comando.payload)) this.navegar(comando.payload - 1);
        break;
      default: break;
    }
  }

  private navegar(indice: number): void {
    const fila = this.registros()[indice];
    if (!fila || this.editable() || indice === this.indiceActual()) return;
    void this.abrirRegistro(fila.ID_REGISTRO_NC);
  }

  /* =============================== Captura ================================== */

  nuevo(): void {
    if (this.editable() || !this.puedeCrear()) return;
    this.empezarCaptura(borradorVacio(this.hoy()));
  }

  private empezarCaptura(borrador: Cal001Borrador): void {
    this.registro.set(null);
    this.partesRegistro = null;
    this.borrador.set(borrador);
    this.parteSeleccionada.set(borrador.PARTES[0]?.CLAVE ?? null);
    this.errores.set([]);
    this.borradorGuardadoEn.set('');
    this.modo.set(RecordToolbarMode.Creating);
    this.pestana.set('registro');
    this.workspace.setDirty(this.applicationId, false);
  }

  modificar(): void {
    const registro = this.registro();
    if (this.editable() || !registro || !this.esGestor() || Number(registro.PUEDE_MODIFICAR) !== 1) return;
    this.borrador.set(borradorDesdeRegistro(registro, this.partesRegistro));
    this.errores.set([]);
    this.modo.set(RecordToolbarMode.Editing);
    this.pestana.set('registro');
    this.workspace.setDirty(this.applicationId, false);
    if (registro.REGISTRO.ORIGEN === Cal001Origen.Cliente) void this.cargarListas();
  }

  private editar(cambio: (borrador: Cal001Borrador) => Cal001Borrador): void {
    const actual = this.borrador();
    if (!actual || !this.editable()) return;
    this.borrador.set(cambio(clonarBorrador(actual)));
    this.workspace.setDirty(this.applicationId, true);
  }

  campo(nombre: CampoEncabezado, valor: string): void {
    if (nombre === 'CANTIDAD_REFERENCIA') {
      const numero = valor.trim() === '' ? null : Number(valor);
      this.editar(b => ({ ...b, CANTIDAD_REFERENCIA: numero !== null && Number.isFinite(numero) ? numero : null }));
      return;
    }
    if (nombre === 'ORIGEN') {
      if (valor === Cal001Origen.Cliente && !this.esGestor()) return;
      if (valor === Cal001Origen.Cliente) void this.cargarListas();
    }
    this.editar(b => ({ ...b, [nombre]: valor }));
  }

  async elegirProducto(producto: Cal001Producto): Promise<void> {
    const actual = this.borrador();
    if (!actual || !this.editable() || producto.PRODUCTO === actual.PRODUCTO) return;
    if (tieneCaptura(actual)) {
      const respuesta = await Swal.fire({
        title: 'Cambiar el producto',
        text: `Al cambiar a ${producto.PRODUCTO} se quitan las piezas, no conformidades y operarios capturados en ${actual.PRODUCTO}. ¿Continuar?`,
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#DF3E3E', cancelButtonColor: '#438ef1',
        confirmButtonText: 'Sí, cambiar', cancelButtonText: 'No'
      });
      if (!respuesta.isConfirmed) return;
    }
    const version = ++this.versionProducto;
    this.cargando.set(true);
    this.cargandoProducto.set(true);
    try {
      const partes = await this.servicio.partesProducto(producto.PRODUCTO);
      // Una respuesta tardía de un PF elegido antes no pisa la del último PF elegido.
      if (version !== this.versionProducto || !this.editable()) return;
      const nuevas = partesDesdeProducto(partes);
      this.editar(b => ({ ...b, PRODUCTO: producto.PRODUCTO, NOMBRE_PRODUCTO: producto.NOMBRE, SIN_PARTES: nuevas[0]?.ID_PARTE === null, PARTES: nuevas }));
      this.parteSeleccionada.set(nuevas[0]?.CLAVE ?? null);
    } catch (error) {
      if (version === this.versionProducto) this.avisar(error);
    } finally {
      if (version === this.versionProducto) {
        this.cargando.set(false);
        this.cargandoProducto.set(false);
      }
    }
  }

  elegirCliente(cliente: Cal001Cliente): void {
    this.editar(b => ({ ...b, ID_CLIENTE: cliente.ID_CLIENTE, NOMBRE_CLIENTE: cliente.NOMBRE }));
  }

  elegirCausaCliente(causa: Cal001Causa): void {
    this.editar(b => ({ ...b, ID_CAUSA_CLIENTE: causa.ID_CAUSA }));
  }

  cambiarPieza(evento: { clave: string; pieza: string }): void {
    this.editar(b => ({ ...b, PARTES: b.PARTES.map(p => p.CLAVE === evento.clave ? { ...p, PIEZA: evento.pieza } : p) }));
  }

  cambiarParte(parte: Cal001ParteBorrador): void {
    this.editar(b => ({ ...b, PARTES: b.PARTES.map(p => p.CLAVE === parte.CLAVE ? parte : p) }));
  }

  seleccionarParte(clave: string): void {
    this.parteSeleccionada.set(clave);
  }

  async guardar(): Promise<void> {
    const borrador = this.borrador();
    if (!borrador || !this.editable() || this.cargando()) return;
    const accion = borrador.ID_REGISTRO_NC ? 'update' : 'new';
    const errores = validarBorrador(borrador, this.hoy(), accion);
    this.errores.set(errores);
    if (errores.length) {
      this.notification.warning(errores[0]);
      return;
    }
    this.cargando.set(true);
    let guardado: { ID_REGISTRO_NC: number; DOCUMENTO: string } | null = null;
    try {
      guardado = await this.servicio.guardar(borrador);
      if (accion === 'new') this.almacen.borrar(this.claveBorrador());
      this.modo.set(RecordToolbarMode.Browsing);
      this.workspace.setDirty(this.applicationId, false);
      this.notification.success(accion === 'new' ? `No conformidad ${guardado.DOCUMENTO} registrada.` : `${guardado.DOCUMENTO} modificado.`);
    } catch (error) {
      const { mensaje, conflictoVersion } = mensajeError(error);
      this.errores.set([mensaje]);
      if (conflictoVersion) void this.avisarConflicto(mensaje);
      else this.notification.error(mensaje);
      return;
    } finally {
      this.cargando.set(false);
    }
    const fotos = this.fotosComponente();
    // Las fotos en cola del registro nuevo pasan al documento creado antes de mostrarlo (las demás se descartan).
    if (accion === 'new') fotos?.adoptar(guardado.ID_REGISTRO_NC);
    await this.abrirRegistro(guardado.ID_REGISTRO_NC);
    if (accion === 'new' && fotos?.pendientes().length) await fotos.subirPendientes(guardado.ID_REGISTRO_NC);
    if (this.consulta()) void this.buscar(this.filtro(), this.consulta()?.PAGINA ?? 1, false);
  }

  /** E22: otro usuario guardó antes. Se ofrece recargar la versión vigente (los cambios de esta pantalla se pierden). */
  private async avisarConflicto(mensaje: string): Promise<void> {
    const respuesta = await Swal.fire({
      title: 'El registro cambió', text: mensaje, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#0A3960', cancelButtonColor: '#8a99a8', confirmButtonText: 'Recargar registro', cancelButtonText: 'Seguir editando'
    });
    const id = this.borrador()?.ID_REGISTRO_NC;
    if (!respuesta.isConfirmed || !id) return;
    this.modo.set(RecordToolbarMode.Browsing);
    this.workspace.setDirty(this.applicationId, false);
    await this.abrirRegistro(id);
  }

  async cancelar(): Promise<void> {
    if (!this.editable() || this.cargando()) return;
    const creando = this.creando();
    const respuesta = await Swal.fire({
      title: this.workspace.getApplicationTitle(this.applicationId),
      text: creando ? '¿Cancelar el registro nuevo? Se descarta también el borrador guardado en este equipo.' : '¿Cancelar la modificación sin guardar?',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#DF3E3E', cancelButtonColor: '#438ef1',
      cancelButtonText: 'No', confirmButtonText: 'Sí, cancelar'
    });
    if (!respuesta.isConfirmed) return;
    if (creando) {
      this.almacen.borrar(this.claveBorrador());
      this.fotosComponente()?.limpiar();
    }
    this.errores.set([]);
    this.workspace.setDirty(this.applicationId, false);
    const registro = this.registro();
    if (registro && !creando) {
      this.borrador.set(borradorDesdeRegistro(registro, this.partesRegistro));
      this.modo.set(RecordToolbarMode.Browsing);
    } else {
      this.borrador.set(null);
      this.modo.set(RecordToolbarMode.Initial);
    }
  }

  /* ========================= Abrir registro y consulta ========================= */

  async abrirRegistro(idRegistro: number): Promise<void> {
    if (this.editable()) {
      this.notification.warning('Guarde o cancele el registro en captura antes de abrir otro.');
      return;
    }
    const version = ++this.version;
    this.cargando.set(true);
    try {
      const registro = await this.servicio.registro(idRegistro);
      const partes = await this.servicio.partesProducto(registro.REGISTRO.PRODUCTO).catch(() => null);
      if (version !== this.version) return;
      this.mostrarRegistro(registro, partes);
      if (registro.REGISTRO.ORIGEN === Cal001Origen.Cliente && !this.listas()) void this.cargarListas();
    } catch (error) {
      if (version === this.version) this.avisar(error);
    } finally {
      if (version === this.version) this.cargando.set(false);
    }
  }

  /** Muestra un registro guardado en solo lectura. */
  mostrarRegistro(registro: Cal001RegistroCompleto, partes: Cal001PartesProducto | null): void {
    const borrador = borradorDesdeRegistro(registro, partes);
    this.registro.set(registro);
    this.partesRegistro = partes;
    this.borrador.set(borrador);
    this.parteSeleccionada.set((borrador.PARTES.find(p => p.CAUSAS.length) ?? borrador.PARTES[0])?.CLAVE ?? null);
    this.errores.set([]);
    this.modo.set(RecordToolbarMode.Browsing);
    this.pestana.set('registro');
    const r = registro.REGISTRO;
    if (!this.registros().some(f => f.ID_REGISTRO_NC === r.ID_REGISTRO_NC)) {
      this.registros.update(lista => [{
        ID_REGISTRO_NC: r.ID_REGISTRO_NC, DOCUMENTO: r.DOCUMENTO, ORIGEN: r.ORIGEN, PRODUCTO: r.PRODUCTO, NOMBRE_PRODUCTO: r.NOMBRE_PRODUCTO,
        FECHA_EVENTO: r.FECHA_EVENTO, FECHA_REGISTRO: r.FECHA_REGISTRO, USUARIO_CREA: r.USUARIO_CREA, USUARIO_MODIFICA: r.USUARIO_MODIFICA,
        FECHA_MODIFICA: r.FECHA_MODIFICA, VERSION: r.VERSION, ID_CLIENTE: r.ID_CLIENTE, NOMBRE_CLIENTE: r.NOMBRE_CLIENTE,
        N_PARTES: registro.PARTES.length, N_CAUSAS: 0, N_OPERARIOS: 0, TOTAL_OCURRENCIAS: 0, N_FOTOS: registro.FOTOS.length
      }, ...lista]);
    }
  }

  /** Recarga el registro abierto (fotos nuevas, cambios de otro usuario). */
  async recargarRegistro(): Promise<void> {
    const id = this.registro()?.REGISTRO.ID_REGISTRO_NC;
    if (id && !this.editable()) await this.abrirRegistro(id);
    else if (id && this.modificando()) {
      const registro = await this.servicio.registro(id).catch(() => null);
      if (registro) this.registro.update(actual => actual ? { ...actual, FOTOS: registro.FOTOS, HISTORIAL: registro.HISTORIAL } : actual);
    }
  }

  irAConsulta(): void {
    this.pestana.set('consulta');
    if (!this.consulta() && !this.consultando()) void this.buscar(this.filtro(), 1);
  }

  async buscar(filtro: Cal001ConsultaFiltro, pagina: number, avisarVacio = true): Promise<void> {
    this.filtro.set(filtro);
    this.consultando.set(true);
    try {
      const resultado = await this.servicio.consulta(filtro, pagina);
      this.consulta.set(resultado);
      if (!this.editable()) this.registros.set(resultado.FILAS);
      if (avisarVacio && !resultado.TOTAL) this.notification.info('No hay registros con esos filtros.');
    } catch (error) {
      this.avisar(error);
    } finally {
      this.consultando.set(false);
    }
  }

  async refrescar(): Promise<void> {
    if (this.pestana() === 'consulta') await this.buscar(this.filtro(), this.consulta()?.PAGINA ?? 1);
    else if (!this.editable()) await this.recargarRegistro();
  }

  /** Exportación a Excel (plan §10.1): todas las páginas del filtro, una fila por operario y causa. */
  async exportar(): Promise<void> {
    const total = this.consulta()?.TOTAL ?? 0;
    if (!total || this.exportando()) return;
    if (total > 300) {
      const respuesta = await Swal.fire({
        title: 'Exportar a Excel', text: `Se exportarán ${total} registros; puede tardar unos minutos. ¿Continuar?`, icon: 'question',
        showCancelButton: true, confirmButtonColor: '#0A3960', cancelButtonColor: '#8a99a8', confirmButtonText: 'Exportar', cancelButtonText: 'Cancelar'
      });
      if (!respuesta.isConfirmed) return;
    }
    const filtro = this.filtro();
    const version = ++this.versionExportacion;
    const progreso = (texto: string): void => { if (version === this.versionExportacion) this.exportando.set(texto); };
    try {
      const ids: number[] = [];
      for (let pagina = 1; ids.length < total; pagina++) {
        progreso(`Leyendo registros ${ids.length}/${total}…`);
        const resultado = await this.servicio.consulta(filtro, pagina, 100);
        ids.push(...resultado.FILAS.map(f => f.ID_REGISTRO_NC));
        if (!resultado.FILAS.length) break;
      }
      const detalles: Cal001RegistroCompleto[] = new Array(ids.length);
      let listos = 0;
      let siguiente = 0;
      let fallo = false;
      // Si un trabajador falla, los demás dejan de pedir registros (fallo) y el progreso ya no se reescribe.
      const trabajador = async (): Promise<void> => {
        while (!fallo && siguiente < ids.length) {
          const indice = siguiente++;
          try {
            detalles[indice] = await this.servicio.registro(ids[indice]);
          } catch (error) {
            fallo = true;
            throw error;
          }
          if (!fallo) progreso(`Preparando ${++listos}/${ids.length}…`);
        }
      };
      await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
      await this.excel.exportar(filasExportacion(detalles), `NoConformidades_${filtro.FECHA_DESDE}_${filtro.FECHA_HASTA}.xlsx`);
    } catch (error) {
      this.avisar(error);
    } finally {
      if (version === this.versionExportacion) this.versionExportacion++;
      this.exportando.set('');
    }
  }

  /* ================================ Apoyo ================================== */

  private async cargarListas(): Promise<void> {
    if (this.listas()) return;
    try {
      this.listas.set(await this.servicio.listasCliente());
    } catch (error) {
      this.avisar(error);
    }
  }

  private opcionesLista(lista: readonly Cal001ValorLista[], actual: string | undefined): string[] {
    const valores = lista.map(v => v.VALOR);
    return actual && !valores.includes(actual) ? [actual, ...valores] : valores;
  }

  private filtroInicial(): Cal001ConsultaFiltro {
    const hoy = hoyColombia();
    return { FECHA_DESDE: sumarDias(hoy, -30), FECHA_HASTA: hoy, ORIGEN: '', DOCUMENTO: '' };
  }

  /** Hoy en Colombia, recalculado en cada uso (la pantalla puede quedar abierta de un día para otro). */
  hoy(): string {
    return hoyColombia();
  }

  avisar(error: unknown): void {
    this.notification.error(mensajeError(error).mensaje);
  }

  aviso(mensaje: string): void {
    this.notification.warning(mensaje);
  }
}
