import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  XteinButtonComponent,
  XteinCheckboxComponent,
  XteinDateComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinPopupComponent,
  XteinSelectComponent
} from '@xtein/ui';
import type { Cal001Causa, Cal001ValorLista } from '../../../cal-001/models/cal-001.model';
import type { Cal003ServicioCompleto } from '../../models/cal-003.model';
import { Cal003ContextoService } from '../../services/cal-003-contexto.service';
import { mensajeError } from '../../utils/cal-003-errores';

/** Parte del producto en la NC: se marca si está afectada y lleva su causa (tipo PRODUCCION de CAL-001). */
interface Cal003NcParte {
  ID_PARTE: string;
  ITEM_PRODUCTO_PARTE: number;
  NOMBRE: string;
  marcada: boolean;
  causa: string;
}

/**
 * No conformidad de cliente (CAL-001) de una entrada, obligatoria. Se crea con la API de CAL-001 ('new', origen
 * CLIENTE) y luego se liga a la entrada ('servicio nc'). No se puede cerrar sin guardarla: si se sale de la pantalla,
 * la entrada queda con el aviso "sin no conformidad" y se registra al abrirla.
 */
@Component({
  selector: 'xtein-cal003-nc',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinButtonComponent,
    XteinCheckboxComponent,
    XteinDateComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinPopupComponent,
    XteinSelectComponent
  ],
  templateUrl: './xtein-cal003-nc.component.html',
  styleUrl: './xtein-cal003-nc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003NcComponent {
  readonly ctx = inject(Cal003ContextoService);

  readonly visible = input(false);
  readonly servicio = input<Cal003ServicioCompleto | null>(null);
  /** Documento de la NC registrada y ligada (NC-0012). */
  readonly registrada = output<string>();
  /** Solo cuando no se puede registrar aquí (sin permisos o error al cargar). */
  readonly cerrado = output<void>();

  readonly cargando = signal(false);
  /** Motivo por el que no se puede registrar aquí (sin permisos en CAL-001 o error al cargar): permite cerrar. */
  readonly bloqueo = signal('');
  readonly causasCliente = signal<Cal001Causa[]>([]);
  readonly causasProduccion = signal<Cal001Causa[]>([]);
  readonly areas = signal<Cal001ValorLista[]>([]);
  readonly fuentes = signal<Cal001ValorLista[]>([]);

  // Formulario
  readonly producto = signal('');
  readonly sinPartes = signal(false);
  readonly partes = signal<Cal003NcParte[]>([]);
  readonly pieza = signal('');
  readonly causaPieza = signal('');
  readonly fechaEvento = signal<string | null>(null);
  readonly fechaReclamo = signal<string | null>(null);
  readonly area = signal('');
  readonly fuente = signal('');
  readonly causaCliente = signal('');
  readonly observacion = signal('');
  /** NC ya creada en CAL-001 que falta ligar (si falló la liga, se reintenta sin crear otra). */
  private readonly creada = signal<{ ID_REGISTRO_NC: number; DOCUMENTO: string } | null>(null);

  /** Productos (PF) del servicio: el registrado o los productos del juego que llegaron. La NC de CAL-001 es por PF. */
  readonly productos = computed(() => {
    const s = this.servicio();
    if (!s) return [];
    const lista = new Map<string, string>();
    if (s.SERVICIO.PRODUCTO.startsWith('PF')) lista.set(s.SERVICIO.PRODUCTO, s.SERVICIO.NOMBRE);
    for (const u of s.UNIDADES) if (u.PRODUCTO.startsWith('PF') && !lista.has(u.PRODUCTO)) lista.set(u.PRODUCTO, u.NOMBRE_PRODUCTO);
    return [...lista].map(([PRODUCTO, NOMBRE]) => ({ PRODUCTO, LABEL: `${PRODUCTO} · ${NOMBRE}` }));
  });

  constructor() {
    effect(() => {
      const abierto = this.visible() && !!this.servicio();
      untracked(() => { if (abierto) void this.cargar(); });
    });
  }

  private async cargar(): Promise<void> {
    const s = this.servicio()!;
    this.bloqueo.set('');
    this.creada.set(null);
    this.fechaEvento.set(s.SERVICIO.FECHA?.slice(0, 10) ?? null);
    this.fechaReclamo.set(s.SERVICIO.FECHA?.slice(0, 10) ?? null);
    this.area.set('');
    this.fuente.set('');
    this.causaCliente.set('');
    this.observacion.set('');
    this.cargando.set(true);
    try {
      const [permisos, causas, listas] = await Promise.all([
        this.ctx.api.ncPermisos(), this.ctx.api.ncCausas(), this.ctx.api.ncListasCliente()
      ]);
      if (permisos?.PUEDE_CREAR !== 1 || permisos?.ES_GESTOR !== 1) {
        this.bloqueo.set('Para registrar la no conformidad necesitas en CAL-001 los permisos Crear y OPC (gestor). La entrada queda pendiente de su no conformidad.');
        return;
      }
      this.causasCliente.set(causas.filter(c => c.TIPO === 'CLIENTE'));
      this.causasProduccion.set(causas.filter(c => c.TIPO === 'PRODUCCION'));
      this.areas.set(listas.AREAS_DETECCION ?? []);
      this.fuentes.set(listas.FUENTES ?? []);
      const primero = this.productos()[0]?.PRODUCTO ?? '';
      await this.elegirProducto(primero);
    } catch (error) {
      this.bloqueo.set(`No se pudo preparar la no conformidad: ${mensajeError(error)}`);
    } finally {
      this.cargando.set(false);
    }
  }

  async elegirProducto(producto: string | null): Promise<void> {
    this.producto.set(producto ?? '');
    this.partes.set([]);
    this.sinPartes.set(false);
    this.pieza.set('');
    this.causaPieza.set('');
    if (!producto) return;
    const datos = await this.ctx.ejecutar(() => this.ctx.api.ncPartesProducto(producto));
    if (!datos) return;
    this.sinPartes.set(datos.SIN_PARTES === 1);
    // Se marcan de entrada las partes de ese producto que llegaron en el servicio
    const llegaron = new Set((this.servicio()?.UNIDADES ?? []).filter(u => u.PRODUCTO === producto && u.PARTE).map(u => u.PARTE));
    this.partes.set((datos.PARTES ?? []).map(p => ({
      ID_PARTE: p.ID_PARTE, ITEM_PRODUCTO_PARTE: p.ITEM_PRODUCTO_PARTE, NOMBRE: p.NOMBRE, marcada: llegaron.has(p.ID_PARTE), causa: ''
    })));
  }

  marcar(indice: number, marcada: boolean): void {
    this.partes.update(lista => lista.map((p, i) => i === indice ? { ...p, marcada } : p));
  }

  causa(indice: number, causa: string | null): void {
    this.partes.update(lista => lista.map((p, i) => i === indice ? { ...p, causa: causa ?? '', marcada: p.marcada || !!causa } : p));
  }

  async guardar(): Promise<void> {
    const s = this.servicio();
    if (!s) return;
    const marcadas = this.partes().filter(p => p.marcada);
    const faltan: string[] = [];
    if (!this.producto()) faltan.push('producto');
    if (!this.fechaEvento()) faltan.push('fecha del evento');
    if (!this.fechaReclamo()) faltan.push('fecha del reclamo');
    if (!this.area()) faltan.push('área de detección');
    if (!this.fuente()) faltan.push('fuente');
    if (!this.causaCliente()) faltan.push('causa del cliente');
    if (this.sinPartes()) {
      if (!this.pieza().trim()) faltan.push('pieza afectada');
      if (!this.causaPieza()) faltan.push('causa de la pieza');
    } else {
      if (!marcadas.length) faltan.push('al menos una parte afectada');
      if (marcadas.some(p => !p.causa)) faltan.push('la causa de cada parte marcada');
    }
    if (faltan.length) {
      this.ctx.advertir(`Falta: ${faltan.join(', ')}.`);
      return;
    }

    const partes = this.sinPartes()
      ? [{ ID_PARTE: null, ITEM_PRODUCTO_PARTE: null, PIEZA: this.pieza().trim(), CAUSAS: [{ ID_CAUSA: this.causaPieza(), OPERARIOS: [] }] }]
      : marcadas.map(p => ({ ID_PARTE: p.ID_PARTE, ITEM_PRODUCTO_PARTE: p.ITEM_PRODUCTO_PARTE, PIEZA: null, CAUSAS: [{ ID_CAUSA: p.causa, OPERARIOS: [] }] }));
    const resultado = await this.ctx.ejecutar(async () => {
      let nc = this.creada();
      if (!nc) {
        nc = await this.ctx.api.ncCrear({
          REGISTRO: {
            ORIGEN: 'CLIENTE', PRODUCTO: this.producto(), CANTIDAD_REFERENCIA: null,
            FECHA_EVENTO: String(this.fechaEvento()).slice(0, 10), OBSERVACION: this.observacion().trim(),
            ID_CLIENTE: s.SERVICIO.ID_CLIENTE, N_SERVICIO: s.SERVICIO.N_SERVICIO_CLIENTE,
            ID_AREA_DETECCION: this.area(), FUENTE: this.fuente(),
            FECHA_RECLAMO: String(this.fechaReclamo()).slice(0, 10), ID_CAUSA_CLIENTE: this.causaCliente()
          },
          PARTES: partes
        });
        this.creada.set(nc);
      }
      return this.ctx.api.servicioNc(s.SERVICIO.ID_SERVICIO, nc.ID_REGISTRO_NC);
    });
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    this.registrada.emit(this.creada()?.DOCUMENTO ?? '');
  }
}
