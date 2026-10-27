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
  it('un juego completo llega entero y se guarda por sus partes', () => {
    const grupo = crearGrupo(comedor());
    expect(lleganDe(grupo).length).toBe(6);
    expect(esParcial(grupo)).toBe(false);
    expect(unidadesEntrada(grupo).UNIDADES).toEqual([
      { NIVEL: 'PA', PRODUCTO: 'PF-2210', PARTE: 'PA-3301', CANTIDAD: 6 },
      { NIVEL: 'PA', PRODUCTO: 'PF-2210', PARTE: 'PA-3302', CANTIDAD: 6 },
      { NIVEL: 'PA', PRODUCTO: 'PF-2211', PARTE: 'PA-3303', CANTIDAD: 1 },
      { NIVEL: 'PA', PRODUCTO: 'PF-2211', PARTE: 'PA-3304', CANTIDAD: 1 }
    ]);
  });

  it('buscar por un producto del juego marca solo ese producto, con cantidad 1', () => {
    const grupo = crearGrupo(comedor('PF-2210'));
    expect(lleganDe(grupo).map(f => f.producto)).toEqual(['PF-2210', 'PA-3301', 'PA-3302']);
    expect(lleganDe(grupo).every(f => f.cantidad === 1)).toBe(true);
    expect(esParcial(grupo)).toBe(true);
  });

  it('desmarcar las partes guarda el producto completo; marcar una parte marca a su padre', () => {
    let grupo = crearGrupo(comedor());
    grupo = marcarLlega(grupo, 1, false);
    expect(grupo.filas.slice(1, 4).every(f => !f.llega)).toBe(true);
    grupo = marcarLlega(grupo, 2, true);
    expect(grupo.filas[1].llega).toBe(true);
    expect(unidadesEntrada(grupo).UNIDADES[0]).toEqual({ NIVEL: 'PA', PRODUCTO: 'PF-2210', PARTE: 'PA-3301', CANTIDAD: 6 });
  });

  it('un producto suelto sin partes llega como producto', () => {
    const grupo = crearGrupo({ CODIGO_BUSCADO: 'PF-7001', PRODUCTO_BUSCADO: null, RAIZ: nodo('PF', 'PF-7001', 1) });
    expect(unidadesEntrada(grupo)).toEqual({ PRODUCTO: 'PF-7001', UNIDADES: [{ NIVEL: 'PF', PRODUCTO: 'PF-7001', PARTE: null, CANTIDAD: 1 }] });
    expect(esParcial(grupo)).toBe(false);
  });

  it('la cantidad queda entre 1 y la del catálogo', () => {
    let grupo = crearGrupo(comedor());
    grupo = cambiarCantidad(grupo, 2, 50);
    expect(grupo.filas[2].cantidad).toBe(6);
    grupo = cambiarCantidad(grupo, 2, 0);
    expect(grupo.filas[2].cantidad).toBe(1);
  });
});
