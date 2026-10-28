import type { Cal003ArbolProducto, Cal003NodoProducto } from '../models/cal-003.model';
import { cambiarCantidad, crearGrupo, esParcial, lleganDe, marcarLlega, unidadesEntrada } from './cal-003-arbol';

const nodo = (NIVEL: Cal003NodoProducto['NIVEL'], PRODUCTO: string, CANTIDAD: number, HIJOS: Cal003NodoProducto[] = []): Cal003NodoProducto =>
  ({ NIVEL, PRODUCTO, CODIGO_ASOCIADO: `CA-${PRODUCTO}`, NOMBRE: PRODUCTO, CANTIDAD, HIJOS });

const comedor = (buscado: string | null = null): Cal003ArbolProducto => ({
  CODIGO_BUSCADO: buscado ?? 'JU-1040',
  PRODUCTO_BUSCADO: buscado,
  RAIZ: nodo('JU', 'JU-1040', 1, [
    nodo('PF', 'PF-2210', 6, [nodo('PA', 'PA-3301', 6), nodo('PA', 'PA-3302', 6)]),
    nodo('PF', 'PF-2211', 1, [nodo('PA', 'PA-3303', 1), nodo('PA', 'PA-3304', 1)])
  ])
});

describe('cal-003-arbol', () => {
  it('un juego llega marcado completo y sus partes empiezan en cero', () => {
    const grupo = crearGrupo(comedor());
    expect(lleganDe(grupo).length).toBe(6);
    expect(esParcial(grupo)).toBe(false);
    expect(unidadesEntrada(grupo).UNIDADES).toEqual([
      { NIVEL: 'PA', PRODUCTO: 'PF-2210', PARTE: 'PA-3301', CANTIDAD: 0 },
      { NIVEL: 'PA', PRODUCTO: 'PF-2210', PARTE: 'PA-3302', CANTIDAD: 0 },
      { NIVEL: 'PA', PRODUCTO: 'PF-2211', PARTE: 'PA-3303', CANTIDAD: 0 },
      { NIVEL: 'PA', PRODUCTO: 'PF-2211', PARTE: 'PA-3304', CANTIDAD: 0 }
    ]);
    // Los productos (no las partes) conservan su cantidad del catálogo
    expect(grupo.filas.filter(f => f.nivel === 'PF').map(f => f.cantidad)).toEqual([6, 1]);
  });

  it('buscar por un producto del juego marca solo ese producto: él con cantidad 1 y sus partes en cero', () => {
    const grupo = crearGrupo(comedor('PF-2210'));
    expect(lleganDe(grupo).map(f => f.producto)).toEqual(['PF-2210', 'PA-3301', 'PA-3302']);
    expect(lleganDe(grupo).map(f => f.cantidad)).toEqual([1, 0, 0]);
    expect(esParcial(grupo)).toBe(true);
  });

  it('desmarcar las partes guarda el producto completo; marcar una parte marca a su padre', () => {
    let grupo = crearGrupo(comedor());
    grupo = marcarLlega(grupo, 1, false);
    expect(grupo.filas.slice(1, 4).every(f => !f.llega)).toBe(true);
    grupo = marcarLlega(grupo, 2, true);
    expect(grupo.filas[1].llega).toBe(true);
    grupo = cambiarCantidad(grupo, 2, 6);
    expect(unidadesEntrada(grupo).UNIDADES[0]).toEqual({ NIVEL: 'PA', PRODUCTO: 'PF-2210', PARTE: 'PA-3301', CANTIDAD: 6 });
  });

  it('un producto suelto sin partes llega como producto', () => {
    const grupo = crearGrupo({ CODIGO_BUSCADO: 'PF-7001', PRODUCTO_BUSCADO: null, RAIZ: nodo('PF', 'PF-7001', 1) });
    expect(unidadesEntrada(grupo)).toEqual({ PRODUCTO: 'PF-7001', UNIDADES: [{ NIVEL: 'PF', PRODUCTO: 'PF-7001', PARTE: null, CANTIDAD: 1 }] });
    expect(esParcial(grupo)).toBe(false);
  });

  it('la cantidad de una parte queda entre 0 y la del catálogo; la de un producto, entre 1 y la del catálogo', () => {
    let grupo = crearGrupo(comedor());
    grupo = cambiarCantidad(grupo, 2, 50);
    expect(grupo.filas[2].cantidad).toBe(6);
    grupo = cambiarCantidad(grupo, 2, 0);
    expect(grupo.filas[2].cantidad).toBe(0);
    grupo = cambiarCantidad(grupo, 1, 0);
    expect(grupo.filas[1].cantidad).toBe(1);
  });
});
