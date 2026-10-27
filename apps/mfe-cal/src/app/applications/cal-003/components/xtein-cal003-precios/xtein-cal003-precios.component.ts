import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordToolbarMode, ToolbarAction } from '@xtein/sdk';
import { XteinGroupLabelComponent, XteinNumberComponent } from '@xtein/ui';
import type { Cal003Precios } from '../../models/cal-003.model';
import { Cal003ContextoService, Cal003EstadoBarra, Cal003Pestana } from '../../services/cal-003-contexto.service';
import { fecha, pesos } from '../../utils/cal-003-formato';

/** Precios ESPECIAL: la persona de costos pone el precio de lo que entró a ARTDECON como ESPECIAL. */
@Component({
  selector: 'xtein-cal003-precios',
  standalone: true,
  imports: [CommonModule, FormsModule, XteinGroupLabelComponent, XteinNumberComponent],
  templateUrl: './xtein-cal003-precios.component.html',
  styleUrl: './xtein-cal003-precios.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal003PreciosComponent implements Cal003Pestana, OnInit {
  readonly ctx = inject(Cal003ContextoService);
  readonly fecha = fecha;
  readonly pesos = pesos;

  readonly datos = signal<Cal003Precios>({ SIN_PRECIO: [], CON_PRECIO: [] });
  /** Precio escrito por servicio (aún sin guardar). */
  readonly escritos = signal<Record<number, number | null>>({});

  readonly barra = computed<Cal003EstadoBarra>(() => ({
    mode: this.ctx.puedePrecio() ? RecordToolbarMode.Editing : RecordToolbarMode.Initial,
    currentIndex: -1,
    total: 0
  }));

  ngOnInit(): void {
    void this.refrescar();
  }

  async ejecutar(accion: string): Promise<void> {
    switch (accion) {
      case ToolbarAction.Save: return this.guardar();
      case ToolbarAction.Cancel:
        this.escritos.set({});
        return;
      case ToolbarAction.Refresh: return this.refrescar();
      default: return;
    }
  }

  async refrescar(): Promise<void> {
    const datos = await this.ctx.ejecutar(() => this.ctx.api.precios());
    if (datos) this.datos.set({ SIN_PRECIO: datos.SIN_PRECIO ?? [], CON_PRECIO: datos.CON_PRECIO ?? [] });
  }

  escribir(id: number, valor: number | null): void {
    this.escritos.update(e => ({ ...e, [id]: valor }));
  }

  /** Recordatorio al día 1 hábil; al día 3 también se avisa al jefe (propuesta por validar). */
  claseDias(dias: number): string {
    return dias >= 3 ? 'c3-badge--danger' : dias >= 1 ? 'c3-badge--warn' : '';
  }

  async guardar(): Promise<void> {
    if (!this.ctx.puedePrecio()) return this.ctx.advertir('Solo la persona de costos pone el precio.');
    const precios = Object.entries(this.escritos())
      .filter(([, v]) => Number(v) > 0)
      .map(([id, v]) => ({ ID_SERVICIO: Number(id), PRECIO: Number(v) }));
    if (!precios.length) return this.ctx.advertir('Escribe al menos un precio.');
    const resultado = await this.ctx.ejecutar(() => this.ctx.api.preciosGuardar(precios));
    if (!resultado) return;
    this.ctx.exito(resultado.MENSAJE);
    this.escritos.set({});
    await this.refrescar();
  }
}
