import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ToolbarRuntimeService } from '@xtein/runtime';
import {
  DeniedRecordToolbarPermissions,
  RecordToolbarMode,
  RecordToolbarPermissions,
  ToolbarAction,
  ToolbarCommand,
  createRecordToolbarState
} from '@xtein/sdk';
import {
  XteinInputComponent,
  XteinLabelComponent,
  XteinLoadingComponent,
  XteinRecordFilterComponent,
  XteinRecordFilterResult,
  XteinSelectComponent
} from '@xtein/ui';
import {
  Cal003Application,
  Cal003FilterOperationField,
  Cal003FilterOperations,
  Cal003FilterTable,
  Cal003Movimientos,
  Cal003RecordTabs,
  Cal003Tab,
  Cal003Tabs,
  Cal003ToolbarCapabilities
} from './constants/cal-003.constants';
import { Cal003Service } from './services/cal-003.service';
import type { Cal003Cabecera, Cal003Consecutivo } from './models/cal-003.model';
import { estadoBadge, fecha, hoy } from './utils/cal-003-formato';
import { Cal003BarraVacia, Cal003ContextoService, Cal003Pestana } from './services/cal-003-contexto.service';
import { XteinCal003EntradaComponent } from './components/xtein-cal003-entrada/xtein-cal003-entrada.component';
import { XteinCal003TrasladoComponent } from './components/xtein-cal003-traslado/xtein-cal003-traslado.component';
import { XteinCal003EntregaComponent } from './components/xtein-cal003-entrega/xtein-cal003-entrega.component';
import { XteinCal003AjusteComponent } from './components/xtein-cal003-ajuste/xtein-cal003-ajuste.component';
import { XteinCal003PreciosComponent } from './components/xtein-cal003-precios/xtein-cal003-precios.component';
import { XteinCal003ConsultasComponent } from './components/xtein-cal003-consultas/xtein-cal003-consultas.component';

/**
 * CAL-003 Servicios técnicos: inventario de los productos que los clientes devuelven por garantía (SG)
 * o reparación (SR). La cabecera lleva Movimiento (ENTRADA, TRASLADO, SALIDA), Estado, Documento, Usuario y Fecha de
 * registro; el Movimiento solo se habilita con Nuevo. Ajuste, Precios ESPECIAL y Consultas se abren con Buscar (aquí, uno
 * solo), que lleva el campo Operación. El resto de la barra actúa sobre el formulario activo.
 * Pre-facturas y la factura de las SR son de otros módulos.
 */
@Component({
  selector: 'xtein-cal-003',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLoadingComponent,
    XteinRecordFilterComponent,
    XteinSelectComponent,
    XteinCal003EntradaComponent,
    XteinCal003TrasladoComponent,
    XteinCal003EntregaComponent,
    XteinCal003AjusteComponent,
    XteinCal003PreciosComponent,
    XteinCal003ConsultasComponent
  ],
  providers: [Cal003Service, Cal003ContextoService],
  templateUrl: './cal-003.component.html',
  styleUrls: ['./cal-003.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Cal003Component implements OnInit, OnDestroy {
  readonly applicationId = Cal003Application.Id;
  readonly tabs = Cal003Tabs;
  readonly movimientos = Cal003Movimientos;
  readonly tab = Cal003Tab;
  readonly badge = estadoBadge;
  readonly fecha = fecha;

  readonly ctx = inject(Cal003ContextoService);
  private readonly toolbar = inject(ToolbarRuntimeService);

  readonly activa = signal<Cal003Tab>(Cal003Tab.Entry);
  /** Valor del select Operación (aparte de activa para poder devolverlo si no se descarta lo que se registra). */
  readonly seleccion = signal<Cal003Tab>(Cal003Tab.Entry);
  readonly filterTable = Cal003FilterTable;
  readonly filterVisible = signal(false);

  private readonly entrada = viewChild(XteinCal003EntradaComponent);
  private readonly traslado = viewChild(XteinCal003TrasladoComponent);
  private readonly entrega = viewChild(XteinCal003EntregaComponent);
  private readonly ajuste = viewChild(XteinCal003AjusteComponent);
  private readonly precios = viewChild(XteinCal003PreciosComponent);
  private readonly consultas = viewChild(XteinCal003ConsultasComponent);

  /** La operación activa está registrando algo nuevo: solo entonces se puede cambiar de operación. */
  readonly creando = computed(() => this.pestana()?.barra().mode === RecordToolbarMode.Creating);

  /** Movimiento de la operación que se ve (ENTRADA, TRASLADO o SALIDA); vacío en Ajuste, Precios y Consultas. */
  readonly movimiento = computed(() => this.movimientos.find(m => m.id === this.activa())?.label ?? '');
  /** Ajuste, Precios y Consultas no son un movimiento del select: se nombran en él como texto de ayuda. */
  readonly otraOperacion = computed(() => this.movimiento() ? '' : (this.tabs.find(t => t.id === this.activa())?.label ?? ''));

  /** Documento que tendrá lo que se está registrando (acción 'consecutivo'). */
  private readonly previa = signal<Cal003Consecutivo | null>(null);

  /** Movimiento, estado, documento, usuario y fecha de registro: del registro abierto o, al crear, del próximo documento. */
  readonly cabecera = computed<Cal003Cabecera>(() => {
    if (this.creando() && this.movimiento()) {
      const p = this.previa();
      return { documento: p?.DOCUMENTO ?? '', estado: 'REGISTRADO', usuario: p?.USUARIO ?? '', fechaRegistro: hoy() };
    }
    return this.pestana()?.cabecera?.() ?? { documento: '', estado: '', usuario: '', fechaRegistro: null };
  });

  readonly pestana = computed<Cal003Pestana | undefined>(() => {
    switch (this.activa()) {
      case Cal003Tab.Entry: return this.entrada();
      case Cal003Tab.Transfer: return this.traslado();
      case Cal003Tab.Delivery: return this.entrega();
      case Cal003Tab.Adjustment: return this.ajuste();
      case Cal003Tab.Prices: return this.precios();
      default: return this.consultas();
    }
  });

  /**
   * Permisos de la barra a partir de los papeles que calcula el SP (no de ADM015 directamente):
   * crear = garantías; anular = garantías o facturación; editar (precios) = costos.
   */
  readonly permisosBarra = computed<RecordToolbarPermissions>(() => {
    const p = this.ctx.permisos();
    if (!p) return DeniedRecordToolbarPermissions;
    const ver = p.PUEDE_VER === 1;
    // La persona de planta también crea: envía traslados desde sus bodegas
    const crea = p.PUEDE_CREAR === 1 || (p.BODEGAS ?? []).length > 0;
    return {
      create: crea,
      edit: p.PUEDE_PRECIO === 1,
      delete: p.PUEDE_CREAR === 1 || p.PUEDE_ANULAR_RECIBIDO === 1,
      search: ver,
      print: ver,
      configure: false
    };
  });

  private readonly subs = new Subscription();

  constructor() {
    effect(() => {
      const barra = this.pestana()?.barra() ?? Cal003BarraVacia;
      const state = createRecordToolbarState({
        busy: this.ctx.busy(),
        applicationId: this.applicationId,
        mode: barra.mode,
        permissions: this.permisosBarra(),
        capabilities: Cal003ToolbarCapabilities[this.activa()],
        currentIndex: barra.currentIndex,
        totalRecords: barra.total
      });
      untracked(() => this.toolbar.setState(state));
    });

    // Al empezar a registrar un movimiento se pide su próximo documento (SEN-1, STR-1, SSA-1).
    effect(() => {
      const movimiento = this.creando() ? this.movimiento() : '';
      untracked(() => {
        this.previa.set(null);
        if (movimiento) void this.cargarPrevia(movimiento);
      });
    });
  }

  private async cargarPrevia(movimiento: string): Promise<void> {
    try {
      const p = await this.ctx.api.consecutivo(movimiento);
      if (this.creando() && this.movimiento() === movimiento) this.previa.set(p);
    } catch (err) {
      this.ctx.advertir(`No se pudo traer el próximo documento: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  ngOnInit(): void {
    this.subs.add(
      this.toolbar
        .commandsForApplication(this.applicationId)
        .subscribe(command => void this.comando(command))
    );
    void this.ctx.cargar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  /**
   * El select solo se habilita mientras se crea: cambiar de operación descarta lo que se estaba
   * registrando (la operación pide confirmar si ya había datos) y empieza la nueva.
   */
  async cambiarOperacion(tab: Cal003Tab | null): Promise<void> {
    if (!tab || tab === this.activa()) return;
    const actual = this.pestana();
    if (actual && this.creando()) {
      await actual.ejecutar(ToolbarAction.Cancel);
      if (actual.barra().mode === RecordToolbarMode.Creating) {
        // No quiso descartar: el select vuelve a la operación que se está registrando
        this.seleccion.set(tab);
        setTimeout(() => this.seleccion.set(this.activa()));
        return;
      }
    }
    await this.mostrar(tab);
    if (Cal003RecordTabs.includes(tab)) await this.pestana()?.ejecutar(ToolbarAction.New);
  }

  private async comando(command: ToolbarCommand): Promise<void> {
    if (this.ctx.busy()) return;
    switch (command.action) {
      case ToolbarAction.New: return this.nuevo();
      case ToolbarAction.Search:
        if (!this.creando()) this.filterVisible.set(true);
        return;
      default:
        await this.pestana()?.ejecutar(command.action, command.payload);
    }
  }

  /** Nuevo: la operación que se ve si se crea; si no, Entrada (o Traslado para la persona de planta). */
  private async nuevo(): Promise<void> {
    let tab = this.activa();
    if (!Cal003RecordTabs.includes(tab)) tab = Cal003Tab.Entry;
    if (tab !== Cal003Tab.Transfer && !this.ctx.puedeCrear() && this.ctx.misBodegas().length > 0) tab = Cal003Tab.Transfer;
    if (tab !== this.activa()) await this.mostrar(tab);
    await this.pestana()?.ejecutar(ToolbarAction.New);
  }

  /** Buscar: el campo Operación escoge el formulario (si no viene, el que se ve) y el resto de criterios va a él. */
  async buscar(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    const criterios = result?.ESTRUCTURA ?? [];
    const operacion = criterios.find(c => c.CAMPO === Cal003FilterOperationField)?.EXPRESION?.trim() ?? '';
    // El semáforo de la fecha de entrega solo existe en las entradas
    const tab = operacion ? Cal003FilterOperations[operacion]
      : criterios.some(c => c.CAMPO === 'ESTADO_ENTREGA') ? Cal003Tab.Entry : this.activa();
    if (!tab) {
      this.ctx.advertir(`Operación no válida: ${operacion}.`);
      return;
    }
    await this.mostrar(tab);
    const resto = criterios.filter(c => c.CAMPO !== Cal003FilterOperationField);
    switch (tab) {
      case Cal003Tab.Entry: return this.entrada()?.buscar(resto);
      case Cal003Tab.Transfer: return this.traslado()?.buscar(resto);
      case Cal003Tab.Delivery: return this.entrega()?.buscar(resto);
      case Cal003Tab.Adjustment: return this.ajuste()?.buscar(resto);
      default: return; // Precios y Consultas solo se abren
    }
  }

  /** Muestra la operación. Precios y Consultas se recargan al entrar: quedan vivas (ocultas) entre visitas. */
  private async mostrar(tab: Cal003Tab): Promise<void> {
    this.activa.set(tab);
    this.seleccion.set(tab);
    if (tab === Cal003Tab.Queries) await this.consultas()?.refrescar();
    else if (tab === Cal003Tab.Prices) await this.precios()?.refrescar();
  }
}
