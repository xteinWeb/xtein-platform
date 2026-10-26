import { borradorProduccion } from '../testing/cal-001.fixtures';
import { Subject } from 'rxjs';
import { type AlmacenBorrador, Cal001AlmacenBorrador, claveBorrador, vigilarCierreSesion } from './cal-001-borrador';
import { bytesBase64, escalar, nombreJpg } from './cal-001-imagen';
import { Cal001BackendError, decodificar, mensajeError } from './cal-001-errores';

/** localStorage en memoria (jsdom comparte el real entre pruebas). */
function almacenMemoria(): AlmacenBorrador & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    get length() { return datos.size; },
    key: (i: number) => [...datos.keys()][i] ?? null,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => { datos.set(k, v); },
    removeItem: (k: string) => { datos.delete(k); }
  };
}

describe('CAL-001 borrador local por empresa y usuario', () => {
  it('la clave lleva empresa y usuario; sin sesión no hay clave', () => {
    expect(claveBorrador('00', 'laura')).toBe('cal001-borrador:00:LAURA');
    expect(claveBorrador('', 'laura')).toBeNull();
    expect(claveBorrador('00', '')).toBeNull();
  });

  it('cada usuario lee solo su borrador', () => {
    const memoria = almacenMemoria();
    const almacen = new Cal001AlmacenBorrador(memoria);
    const laura = claveBorrador('00', 'LAURA');
    const andres = claveBorrador('00', 'ANDRES');
    expect(almacen.guardar(laura, borradorProduccion())).toBe(true);
    expect(almacen.leer(laura)?.BORRADOR.PRODUCTO).toBe('PF-2201');
    expect(almacen.leer(andres)).toBeNull();
    expect(almacen.leer(claveBorrador('01', 'LAURA'))).toBeNull();
  });

  it('se borra al guardar o cancelar (borrar) y al cerrar sesión o cambiar de usuario (borrarAjenos)', () => {
    const memoria = almacenMemoria();
    const almacen = new Cal001AlmacenBorrador(memoria);
    const laura = claveBorrador('00', 'LAURA');
    const andres = claveBorrador('00', 'ANDRES');
    almacen.guardar(laura, borradorProduccion());
    almacen.guardar(andres, borradorProduccion());
    memoria.setItem('otra-app', 'x');

    almacen.borrarAjenos(andres);
    expect(almacen.leer(laura)).toBeNull();
    expect(almacen.leer(andres)).not.toBeNull();

    almacen.borrar(andres);
    expect(almacen.leer(andres)).toBeNull();

    almacen.guardar(laura, borradorProduccion());
    almacen.borrarAjenos(null);
    expect([...memoria.datos.keys()]).toEqual(['otra-app']);
  });

  it('si el almacenamiento falla o trae basura la captura sigue sin borrador (try/catch)', () => {
    const roto: AlmacenBorrador = {
      length: 1, key: () => { throw new Error('bloqueado'); }, getItem: () => { throw new Error('bloqueado'); },
      setItem: () => { throw new Error('cuota'); }, removeItem: () => { throw new Error('bloqueado'); }
    };
    const almacen = new Cal001AlmacenBorrador(roto);
    const clave = claveBorrador('00', 'LAURA');
    expect(almacen.guardar(clave, borradorProduccion())).toBe(false);
    expect(almacen.leer(clave)).toBeNull();
    expect(() => almacen.borrar(clave)).not.toThrow();
    expect(() => almacen.borrarAjenos(null)).not.toThrow();

    const memoria = almacenMemoria();
    memoria.setItem(clave!, '{no es json');
    expect(new Cal001AlmacenBorrador(memoria).leer(clave)).toBeNull();
    expect(new Cal001AlmacenBorrador(null).guardar(clave, borradorProduccion())).toBe(false);
  });
});

describe('CAL-001 borrador: clave guardada y cierre de sesión', () => {
  it('un borrador guardado con otra clave no se ofrece y se borra', () => {
    const memoria = almacenMemoria();
    const clave = claveBorrador('00', 'LAURA')!;
    memoria.setItem(clave, JSON.stringify({ CLAVE: 'cal001-borrador:00:ANDRES', GUARDADO_EN: '', BORRADOR: borradorProduccion() }));
    expect(new Cal001AlmacenBorrador(memoria).leer(clave)).toBeNull();
    expect(memoria.getItem(clave)).toBeNull();
  });

  it('el evento logout de la sesión borra todos los borradores de CAL-001 (y se registra una sola vez)', () => {
    const memoria = almacenMemoria();
    const almacen = new Cal001AlmacenBorrador(memoria);
    almacen.guardar(claveBorrador('00', 'LAURA'), borradorProduccion());
    memoria.setItem('otra-app', 'x');
    const updates = new Subject<{ type: string }>();
    const suscripcion = vigilarCierreSesion({ updates }, almacen);
    expect(vigilarCierreSesion({ updates }, almacen)).toBeNull();
    updates.next({ type: 'token' });
    expect(memoria.length).toBe(2);
    updates.next({ type: 'logout' });
    expect([...memoria.datos.keys()]).toEqual(['otra-app']);
    suscripcion?.unsubscribe();
  });
});

describe('CAL-001 mensajes de error legibles', () => {
  it('E22 se marca como conflicto de versión con indicación de recargar', () => {
    const { mensaje, conflictoVersion } = mensajeError(new Cal001BackendError('Modificado por ANDRES el 2026-10-26T10:00:00; recargue'));
    expect(conflictoVersion).toBe(true);
    expect(mensaje).toContain('Modificado por ANDRES el 2026-10-26T10:00:00');
    expect(mensaje).toContain('recargue el registro');
  });

  it('413, 415, 429 y sin conexión tienen texto propio', () => {
    expect(mensajeError({ status: 413, error: { error: 'La foto supera el tamaño máximo de 3 MB' } }).mensaje).toBe('La foto supera el tamaño máximo de 3 MB.');
    expect(mensajeError({ status: 415, error: null }).mensaje).toContain('JPG, PNG o WEBP');
    expect(mensajeError({ status: 429, error: null }).mensaje).toContain('demasiadas fotos');
    expect(mensajeError({ status: 0, error: null }).mensaje).toContain('No hay conexión');
  });

  it('el 400 del controlador muestra su ErrMensaje y E99 pide avisar a soporte', () => {
    const rechazo = { status: 400, error: { data: '[{"ErrMensaje":"Campo no permitido en la petición: USUARIO"}]', error: 'x' } };
    expect(mensajeError(rechazo).mensaje).toBe('Petición rechazada: Campo no permitido en la petición: USUARIO');
    expect(mensajeError(new Cal001BackendError('Error interno (2627)')).mensaje).toContain('avise a soporte');
  });

  it('decodifica data como texto JSON y lanza el ErrMensaje del SP', () => {
    expect(decodificar<{ A: number }>({ data: '[{"A":1,"ErrMensaje":""}]', token: 't' })).toEqual([{ A: 1, ErrMensaje: '' }]);
    expect(decodificar({ data: { MIME: 'image/jpeg', BASE64: 'AA==' } })).toEqual([{ MIME: 'image/jpeg', BASE64: 'AA==' }]);
    expect(() => decodificar({ data: '[{"ErrMensaje":"Sin permiso para modificar"}]' })).toThrow('Sin permiso para modificar');
    const consola = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => decodificar({ data: '<html>502</html>' })).toThrow('La respuesta del servidor no es válida');
    expect(consola).toHaveBeenCalled();
    consola.mockRestore();
  });
});

describe('CAL-001 compresión de fotos', () => {
  it('escala al lado mayor de 1600 px sin ampliar', () => {
    expect(escalar(4000, 3000)).toEqual({ ancho: 1600, alto: 1200 });
    expect(escalar(1200, 3600)).toEqual({ ancho: 533, alto: 1600 });
    expect(escalar(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it('calcula los bytes reales del base64 y nombra la foto como .jpg', () => {
    expect(bytesBase64('QUJD')).toBe(3);
    expect(bytesBase64('data:image/jpeg;base64,QUI=')).toBe(2);
    expect(nombreJpg('IMG_001.HEIC')).toBe('IMG_001.jpg');
    expect(nombreJpg('')).toBe('foto.jpg');
  });
});
