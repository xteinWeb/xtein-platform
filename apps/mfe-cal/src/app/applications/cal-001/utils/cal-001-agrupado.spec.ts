import { borradorCliente, borradorProduccion, registroGuardado } from '../testing/cal-001.fixtures';
import type { Cal001RegistroCompleto } from '../models/cal-001.model';
import { filasExportacion, ncPorOperario } from './cal-001-agrupado';
import { descripcionVisible, filtrarCausas } from './cal-001-causas';
import { CausasPrueba } from '../testing/cal-001.fixtures';

describe('CAL-001 "No conformidades por operario" (ajuste 3)', () => {
  it('agrupa por operario con sus causas y la suma de ocurrencias de todas las partes', () => {
    const borrador = borradorProduccion();
    borrador.PARTES[1].CAUSAS = [{ ID_CAUSA_NC: null, ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', DESCRIPCION: '',
      OPERARIOS: [{ ...borrador.PARTES[0].CAUSAS[1].OPERARIOS[0], OCURRENCIAS: 4 }] }];
    const filas = ncPorOperario(borrador);
    expect(filas.map(f => f.NOMBRE)).toEqual(['Óscar Villa', 'Diana Mesa']);
    expect(filas[0]).toMatchObject({ PROCESO: 'Ebanistería', TOTAL: 2, CAUSAS: [{ ID_CAUSA: 'NC-01', OCURRENCIAS: 2 }] });
    expect(filas[1].TOTAL).toBe(1 + 3 + 4);
    expect(filas[1].CAUSAS).toEqual([
      { ID_CAUSA: 'NC-01', NOMBRE: 'Grado', OCURRENCIAS: 1 },
      { ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', OCURRENCIAS: 7 }
    ]);
  });

  it('un registro de Cliente sin operarios no tiene filas', () => {
    expect(ncPorOperario(borradorCliente())).toEqual([]);
  });
});

describe('CAL-001 exportación de Consulta (plan §10.1)', () => {
  it('trae una fila por operario y causa con documento, fecha del evento, producto, parte, causa, operario, proceso y ocurrencias', () => {
    const registro = registroGuardado();
    registro.PARTES[0].CAUSAS[0].OPERARIOS.push({ ID_OPERARIO_NC: 31, ID_EMPLEADO: '1002', NOMBRE: 'Diana Mesa', OCURRENCIAS: 5,
      ID_SECCION: 'S20', DESCRIPCION_SECCION: 'Pintura' });
    const filas = filasExportacion([registro]);
    expect(filas).toEqual([
      { DOCUMENTO: 'NC-0007', ORIGEN: 'Producción', FECHA_EVENTO: '2026-10-20', PRODUCTO: 'PF-2201', NOMBRE_PRODUCTO: 'Nochero Duna',
        PARTE: 'PA-501 · Tapa superior · Tapa', CAUSA: 'NC-01', NOMBRE_CAUSA: 'Grado', OPERARIO: '1001', NOMBRE_OPERARIO: 'Óscar Villa',
        PROCESO: 'Ebanistería', OCURRENCIAS: 2 },
      { DOCUMENTO: 'NC-0007', ORIGEN: 'Producción', FECHA_EVENTO: '2026-10-20', PRODUCTO: 'PF-2201', NOMBRE_PRODUCTO: 'Nochero Duna',
        PARTE: 'PA-501 · Tapa superior · Tapa', CAUSA: 'NC-01', NOMBRE_CAUSA: 'Grado', OPERARIO: '1002', NOMBRE_OPERARIO: 'Diana Mesa',
        PROCESO: 'Pintura', OCURRENCIAS: 5 }
    ]);
  });

  it('una causa sin operarios (Cliente) sale en una fila con el operario vacío; "Producto completo" usa la pieza', () => {
    const registro: Cal001RegistroCompleto = registroGuardado();
    registro.REGISTRO.ORIGEN = 'CLIENTE';
    registro.PARTES = [{ ID_PARTE_NC: 11, ITEM: 1, ID_PARTE: null, ITEM_PRODUCTO_PARTE: null, NOMBRE_PARTE: null, PIEZA: 'Cajón',
      CAUSAS: [{ ID_CAUSA_NC: 21, ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', DESCRIPCION: 'Arenilla', OPERARIOS: [] }] }];
    const [fila] = filasExportacion([registro]);
    expect(fila).toMatchObject({ ORIGEN: 'Cliente', PARTE: 'Producto completo · Cajón', CAUSA: 'NC-02', OPERARIO: '', OCURRENCIAS: null });
  });
});

describe('CAL-001 desplegable de causales (ajuste 4)', () => {
  it('busca por id, nombre y descripción, sin tildes ni mayúsculas', () => {
    expect(filtrarCausas(CausasPrueba, 'nc-03').map(c => c.ID_CAUSA)).toEqual(['NC-03']);
    expect(filtrarCausas(CausasPrueba, 'ARENILLA').map(c => c.ID_CAUSA)).toEqual(['NC-02']);
    expect(filtrarCausas(CausasPrueba, 'especificado madera').map(c => c.ID_CAUSA)).toEqual(['NC-01']);
    expect(filtrarCausas(CausasPrueba, 'pintura poros').map(c => c.ID_CAUSA)).toEqual(['NC-03']);
    expect(filtrarCausas(CausasPrueba, 'durabilídad').map(c => c.ID_CAUSA)).toEqual(['RC-01']);
    expect(filtrarCausas(CausasPrueba, '  ')).toHaveLength(CausasPrueba.length);
  });

  it('la descripción se muestra una sola vez si es igual al nombre', () => {
    expect(descripcionVisible(CausasPrueba[1])).toBe('');
    expect(descripcionVisible(CausasPrueba[0])).toContain('Corte de la madera');
  });
});
