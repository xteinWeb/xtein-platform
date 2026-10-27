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
import { DeniedRecordToolbarPermissions, RecordToolbarPermissions, ToolbarCommand, createRecordToolbarState } from '@xtein/sdk';
import { XteinLabelComponent, XteinLoadingComponent, XteinSelectComponent } from '@xtein/ui';
import { Cal003Application, Cal003Tab, Cal003Tabs, Cal003ToolbarCapabilities } from './constants/cal-003.constants';
import { Cal003Service } from './services/cal-003.service';
import { Cal003BarraVacia, Cal003ContextoService, Cal003Pestana } from './services/cal-003-contexto.service';
import { XteinCal003EntradaComponent } from './components/xtein-cal003-entrada/xtein-cal003-entrada.component';
import { XteinCal003TrasladoComponent } from './components/xtein-cal003-traslado/xtein-cal003-traslado.component';
import { XteinCal003EntregaComponent } from './components/xtein-cal003-entrega/xtein-cal003-entrega.component';
import { XteinCal003AjusteComponent } from './components/xtein-cal003-ajuste/xtein-cal003-ajuste.component';
import { XteinCal003PreciosComponent } from './components/xtein-cal003-precios/xtein-cal003-precios.component';
import { XteinCal003ConsultasComponent } from './components/xtein-cal003-consultas/xtein-cal003-consultas.component';

/**
 * CAL-003 Servicios técnicos: inventario de los productos que los clientes devuelven por garantía (SG)
 * o reparación (SR). El select Operación escoge el formulario (Entrada, Traslado, Salida · Entrega,
 * Salida · Ajuste, Precios ESPECIAL o Consultas); la barra de acciones actúa sobre el formulario activo.
 * Pre-facturas y la factura de las SR son de otros módulos.
 */
@Component({
  selector: 'xtein-cal-003',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinLabelComponent,
    XteinLoadingComponent,
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
  readonly tab = Cal003Tab;

  readonly ctx = inject(Cal003ContextoService);
  private readonly toolbar = inject(ToolbarRuntimeService);

  readonly activa = signal<Cal003Tab>(Cal003Tab.Entry);
  /** Pestañas ya abiertas: se cargan la primera vez que se muestran. */

  private readonly entrada = viewChild(XteinCal003EntradaComponent);
  private readonly traslado = viewChild(XteinCal003TrasladoComponent);
  private readonly entrega = viewChild(XteinCal003EntregaComponent);
  private readonly ajuste = viewChild(XteinCal003AjusteComponent);
  private readonly precios = viewChild(XteinCal003PreciosComponent);
  private readonly consultas = viewChild(XteinCal003ConsultasComponent);

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
    // El traslado también lo envía la persona de planta desde sus bodegas
    const crea = p.PUEDE_CREAR === 1 || (this.activa() === Cal003Tab.Transfer && (p.BODEGAS ?? []).length > 0);
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
  }

  ngOnInit(): void {
    this.subs.add(
      this.toolbar
        .commandsForApplication(this.applicationId)
        .subscribe(command => void this.comando(command))
    );
    void this.ctx.cargar().then(() => this.visitar(this.activa(), true));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  cambiarPestana(tab: Cal003Tab | null): void {
    if (!tab || tab === this.activa()) return;
    this.activa.set(tab);
    void this.visitar(tab);
  }

  /**
   * Entrada y Entrega esperan Buscar o Nuevo. Las demás quedan vivas (ocultas) al cambiar de operación,
   * así que se recargan cada vez que se entra a ellas, para ver lo registrado en otra (p. ej. una entrada nueva).
   * Al abrir la pantalla, Traslado, Ajuste y Precios ya cargaron solos al crearse.
   */
  private async visitar(tab: Cal003Tab, alAbrir = false): Promise<void> {
    if (tab === Cal003Tab.Queries) await this.consultas()?.refrescar();
    else if (alAbrir) return;
    else if (tab === Cal003Tab.Transfer) await this.traslado()?.refrescar();
    else if (tab === Cal003Tab.Adjustment) await this.ajuste()?.refrescar();
    else if (tab === Cal003Tab.Prices) await this.precios()?.refrescar();
  }

  private async comando(command: ToolbarCommand): Promise<void> {
    if (this.ctx.busy()) return;
    await this.pestana()?.ejecutar(command.action, command.payload);
  }
}
