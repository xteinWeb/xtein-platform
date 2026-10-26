/** Alto máximo del panel desplegable en escritorio (igual al max-height del SCSS). */
const AltoPanel = 360;
const AltoMinimo = 160;
const Margen = 8;

export interface Cal001UbicacionPanel {
  /** true: el panel se abre hacia arriba del disparador. */
  arriba: boolean;
  /** Alto máximo en px; null en el celular (hoja inferior con su propio alto). */
  alto: number | null;
}

/**
 * Decide hacia dónde abrir un panel desplegable: mide el espacio libre debajo y encima del disparador dentro del
 * área visible (el contenedor con scroll más cercano recortado a la ventana) y lo abre hacia arriba si no cabe abajo.
 */
export function ubicarPanel(disparador: HTMLElement): Cal001UbicacionPanel {
  if (typeof window === 'undefined' || window.matchMedia?.('(max-width: 600px)').matches) return { arriba: false, alto: null };
  const caja = disparador.getBoundingClientRect();
  let superior = 0;
  let inferior = window.innerHeight;
  for (let el = disparador.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|hidden)/.test(getComputedStyle(el).overflowY)) {
      const limite = el.getBoundingClientRect();
      superior = Math.max(superior, limite.top);
      inferior = Math.min(inferior, limite.bottom);
      break;
    }
  }
  const abajo = inferior - caja.bottom - Margen;
  const encima = caja.top - superior - Margen;
  const arriba = abajo < AltoPanel && encima > abajo;
  return { arriba, alto: Math.max(AltoMinimo, Math.min(AltoPanel, arriba ? encima : abajo)) };
}
