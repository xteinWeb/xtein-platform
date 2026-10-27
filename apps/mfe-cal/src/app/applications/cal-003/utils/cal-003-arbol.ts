import type { Cal003ArbolProducto, Cal003EntradaProducto, Cal003Level, Cal003NodoProducto } from '../models/cal-003.model';

/** Fila del árbol de un producto agregado a la entrada (juego → productos → partes). */
export interface Cal003FilaArbol {
  nivel: Cal003Level;
  producto: string;
  codigoAsociado: string;
  nombre: string;
  /** Cantidad del catálogo: tope de lo que puede llegar. */
  cantidadMax: number;
  /** Lo que llega (1..cantidadMax). */
  cantidad: number;
  llega: boolean;
  /** Índice del padre en `filas` (-1 en la raíz). */
  padre: number;
  hijos: number[];
}

/** Producto agregado a la entrada: al guardar queda como un servicio S. */
export interface Cal003GrupoEntrada {
  raiz: string;
  nombre: string;
  filas: Cal003FilaArbol[];
}

/**
 * Arma el grupo de un producto. Si se buscó por el código de un producto del juego (p. ej. una silla
 * del comedor), solo se marca ese producto con sus partes y cantidad 1; si no, llega todo completo.
 */
export function crearGrupo(arbol: Cal003ArbolProducto): Cal003GrupoEntrada {
  const filas: Cal003FilaArbol[] = [];
  const agregar = (nodo: Cal003NodoProducto, padre: number): number => {
    const indice = filas.length;
    const cantidad = Math.max(1, Number(nodo.CANTIDAD) || 1);
    filas.push({
      nivel: nodo.NIVEL,
      producto: nodo.PRODUCTO,
      codigoAsociado: nodo.CODIGO_ASOCIADO ?? '',
      nombre: nodo.NOMBRE,
      cantidadMax: cantidad,
      cantidad,
      llega: true,
      padre,
      hijos: []
    });
    for (const hijo of nodo.HIJOS ?? []) filas[indice].hijos.push(agregar(hijo, indice));
    return indice;
  };
  agregar(arbol.RAIZ, -1);

  const buscado = arbol.PRODUCTO_BUSCADO ? filas.findIndex(f => f.nivel === 'PF' && f.producto === arbol.PRODUCTO_BUSCADO) : -1;
  if (filas[0].nivel === 'JU' && buscado > 0) {
    filas.forEach((fila, i) => {
      fila.llega = i === 0 || i === buscado || fila.padre === buscado;
      fila.cantidad = 1;
    });
  }
  return { raiz: arbol.RAIZ.PRODUCTO, nombre: arbol.RAIZ.NOMBRE, filas };
}

/** Marca o desmarca una fila con todo lo que cuelga de ella; al marcar, marca también sus padres. */
export function marcarLlega(grupo: Cal003GrupoEntrada, indice: number, llega: boolean): Cal003GrupoEntrada {
  const filas = grupo.filas.map(f => ({ ...f }));
  const marcar = (i: number) => {
    filas[i].llega = llega;
    filas[i].hijos.forEach(marcar);
  };
  marcar(indice);
  if (llega) for (let p = filas[indice].padre; p >= 0; p = filas[p].padre) filas[p].llega = true;
  return { ...grupo, filas };
}

export function cambiarCantidad(grupo: Cal003GrupoEntrada, indice: number, cantidad: number): Cal003GrupoEntrada {
  const filas = grupo.filas.map((f, i) => i === indice
    ? { ...f, cantidad: Math.max(1, Math.min(Math.trunc(Number(cantidad) || 1), f.cantidadMax)) }
    : f);
  return { ...grupo, filas };
}

/** Filas físicas que llegan: productos y partes marcados (el juego no es una unidad física). */
export function lleganDe(grupo: Cal003GrupoEntrada): Cal003FilaArbol[] {
  return grupo.filas.filter(f => f.llega && f.nivel !== 'JU');
}

/** Juego del que no llegó todo: el servicio queda como "llegó una parte". */
export function esParcial(grupo: Cal003GrupoEntrada): boolean {
  return grupo.filas[0]?.nivel === 'JU' && lleganDe(grupo).length < grupo.filas.length - 1;
}

/**
 * Unidades que se guardan: cada fila que llega y no tiene hijos marcados. Un producto con alguna parte
 * marcada se guarda por sus partes; uno sin partes marcadas, como producto completo.
 */
export function unidadesEntrada(grupo: Cal003GrupoEntrada): Cal003EntradaProducto {
  const filas = grupo.filas;
  const unidades = lleganDe(grupo)
    .filter(f => !f.hijos.some(h => filas[h].llega))
    .map(f => f.nivel === 'PA'
      ? { NIVEL: 'PA' as const, PRODUCTO: filas[f.padre].producto, PARTE: f.producto, CANTIDAD: f.cantidad }
      : { NIVEL: 'PF' as const, PRODUCTO: f.producto, PARTE: null, CANTIDAD: f.cantidad });
  return { PRODUCTO: grupo.raiz, UNIDADES: unidades };
}
