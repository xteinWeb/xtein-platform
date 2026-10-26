import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import type { Cal001HistorialDetalle, Cal001HistorialResumen } from '../../models/cal-001.model';
import { Cal001Service } from '../../services/cal-001.service';
import { mensajeError } from '../../utils/cal-001-errores';
import { mostrarFecha } from '../../utils/cal-001-fecha';

const Acciones: Record<string, string> = {
  CREAR: 'Registro original', MODIFICAR: 'Modificación', FOTO_AGREGAR: 'Foto agregada', FOTO_RETIRAR: 'Foto retirada'
};

/** Campos del encabezado que no se listan como cambio (los pone el sistema en cada modificación). */
const CamposSistema = new Set(['VERSION', 'USUARIO_MODIFICA', 'FECHA_MODIFICA', 'ErrMensaje']);

/** Cambios legibles entre DATOS_ANTES y DATOS_DESPUES de una modificación. */
export function resumirCambios(antes: unknown, despues: unknown): string[] {
  const objeto = (valor: unknown): Record<string, unknown> => {
    let dato = valor;
    try {
      if (typeof valor === 'string') dato = JSON.parse(valor);
    } catch {
      return {};
    }
    return dato && typeof dato === 'object' && !Array.isArray(dato) ? dato as Record<string, unknown> : {};
  };
  const a = objeto(antes);
  const d = objeto(despues);
  const encabezadoA = objeto(a['REGISTRO'] ?? a);
  const encabezadoD = objeto(d['REGISTRO'] ?? d);
  const cambios: string[] = [];
  for (const campo of new Set([...Object.keys(encabezadoA), ...Object.keys(encabezadoD)])) {
    if (CamposSistema.has(campo) || campo === 'PARTES' || campo === 'FOTOS') continue;
    const valorA = encabezadoA[campo] ?? '';
    const valorD = encabezadoD[campo] ?? '';
    if (JSON.stringify(valorA) !== JSON.stringify(valorD)) cambios.push(`${campo}: ${String(valorA) || '—'} → ${String(valorD) || '—'}`);
  }
  if (JSON.stringify(a['PARTES'] ?? null) !== JSON.stringify(d['PARTES'] ?? null)) cambios.push('Partes, no conformidades u operarios modificados.');
  return cambios;
}

/** Historial de modificaciones (historia 3): quién creó, quién modificó y cuándo, con el motivo y los cambios. */
@Component({
  selector: 'xtein-cal001-historial',
  standalone: true,
  templateUrl: './xtein-cal001-historial.component.html',
  styleUrl: './xtein-cal001-historial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCal001HistorialComponent {
  private readonly servicio = inject(Cal001Service);
  readonly resumen = input<readonly Cal001HistorialResumen[]>([]);
  readonly idRegistro = input<number | null>(null);
  readonly aviso = output<string>();
  readonly detalle = signal<(Cal001HistorialDetalle & { CAMBIOS: string[] })[] | null>(null);
  readonly cargando = signal(false);
  readonly fecha = mostrarFecha;
  private version = 0;

  constructor() {
    // Otro registro: se descarta el detalle mostrado y cualquier respuesta que llegue tarde del anterior.
    effect(() => {
      this.idRegistro();
      untracked(() => {
        this.version++;
        this.detalle.set(null);
        this.cargando.set(false);
      });
    });
  }

  accion(codigo: string): string {
    return Acciones[codigo] ?? codigo;
  }

  async verDetalle(): Promise<void> {
    const id = this.idRegistro();
    if (!id) return;
    const version = ++this.version;
    this.cargando.set(true);
    try {
      const filas = await this.servicio.historial(id);
      if (version !== this.version) return;
      this.detalle.set(filas.map(fila => ({
        ...fila, CAMBIOS: fila.ACCION === 'MODIFICAR' ? resumirCambios(fila.DATOS_ANTES, fila.DATOS_DESPUES) : []
      })));
    } catch (error) {
      if (version === this.version) this.aviso.emit(mensajeError(error).mensaje);
    } finally {
      if (version === this.version) this.cargando.set(false);
    }
  }
}
