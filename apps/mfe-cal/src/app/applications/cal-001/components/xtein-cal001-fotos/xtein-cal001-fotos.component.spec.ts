import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { Cal001Foto } from '../../models/cal-001.model';
import { Cal001Service } from '../../services/cal-001.service';
import { Cal001BackendError } from '../../utils/cal-001-errores';
import { XteinCal001FotosComponent } from './xtein-cal001-fotos.component';

const swal = vi.hoisted(() => ({ fire: vi.fn(async () => ({ isConfirmed: true, value: '' })) }));
vi.mock('sweetalert2', () => ({ default: swal }));

describe('XteinCal001FotosComponent', () => {
  let fixture: ComponentFixture<XteinCal001FotosComponent>;
  let componente: XteinCal001FotosComponent;
  const subirFoto = vi.fn<(id: number, nombre: string, base64: string, idOperacion: string) => Promise<number>>();
  const retirarFoto = vi.fn<(idFoto: number, motivo: string) => Promise<void>>();

  beforeEach(() => {
    subirFoto.mockReset();
    retirarFoto.mockReset();
    TestBed.configureTestingModule({ imports: [XteinCal001FotosComponent], providers: [{ provide: Cal001Service, useValue: { subirFoto, retirarFoto } }] });
    fixture = TestBed.createComponent(XteinCal001FotosComponent);
    componente = fixture.componentInstance;
  });
  afterEach(() => fixture.destroy());

  const abrir = (id: number | null): void => {
    fixture.componentRef.setInput('idRegistro', id);
    fixture.detectChanges();
  };

  it('A1: una foto en error de NC-0001 no se sube a NC-0002 al reintentar', async () => {
    abrir(1);
    subirFoto.mockRejectedValueOnce(new Cal001BackendError('Sin permiso para agregar fotos'));
    componente.encolar('tapa.jpg', 'QUJD');
    await componente.subirPendientes(1);
    expect(componente.cola()[0].estado).toBe('error');

    abrir(2);
    expect(componente.pendientes()).toEqual([]);
    componente.reintentar();
    await componente.subirPendientes(2);
    expect(subirFoto).toHaveBeenCalledTimes(1);
    expect(subirFoto).not.toHaveBeenCalledWith(2, expect.anything(), expect.anything(), expect.anything());
  });

  it('A1: subirPendientes(id) sube solo las fotos cuyo dueño es id', async () => {
    abrir(1);
    componente.encolar('de-1.jpg', 'QUJD');
    // Una foto de otro registro que quedara en la señal (p. ej. antes de que corra el effect) no se sube.
    componente.pendientes.update(lista => [...lista, { ...lista[0], id: 999, dueno: 7, nombre: 'de-7.jpg' }]);
    subirFoto.mockResolvedValue(1);
    await componente.subirPendientes(1);
    expect(subirFoto.mock.calls.map(c => [c[0], c[1]])).toEqual([[1, 'de-1.jpg']]);
  });

  it('A1: al guardar un registro nuevo sus fotos en cola pasan al documento creado; las de otro se descartan', async () => {
    abrir(null);
    componente.encolar('nueva.jpg', 'QUJD');
    componente.adoptar(15);
    abrir(15);
    expect(componente.cola().map(f => [f.dueno, f.nombre])).toEqual([[15, 'nueva.jpg']]);
    subirFoto.mockResolvedValue(3);
    expect(await componente.subirPendientes(15)).toBe(1);
    expect(subirFoto).toHaveBeenCalledWith(15, 'nueva.jpg', 'QUJD', expect.stringMatching(/^[0-9a-f-]{36}$/));
  });

  it('M1: dos llamadas concurrentes suben cada foto una sola vez y Reintentar se deshabilita', async () => {
    abrir(1);
    componente.encolar('a.jpg', 'QUJD');
    componente.encolar('b.jpg', 'QUJD');
    let liberar: () => void = () => undefined;
    subirFoto.mockImplementation(() => new Promise<number>(resolver => { liberar = () => resolver(1); }));
    const primera = componente.subirPendientes(1);
    const segunda = componente.subirPendientes(1);
    fixture.detectChanges();
    const boton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => /Subiendo|Reintentar/.test(b.textContent ?? ''));
    expect(boton?.disabled).toBe(true);
    expect(await segunda).toBe(0);
    for (let i = 0; i < 2; i++) { liberar(); await new Promise(r => setTimeout(r)); }
    expect(await primera).toBe(2);
    expect(subirFoto.mock.calls.map(c => c[1])).toEqual(['a.jpg', 'b.jpg']);
  });

  it('fase 2: cada foto lleva su ID_OPERACION (GUID) y lo conserva al reintentar; otra foto lleva otro', async () => {
    abrir(1);
    componente.encolar('a.jpg', 'QUJD');
    componente.encolar('b.jpg', 'QUJD');
    subirFoto.mockRejectedValueOnce({ status: 0, error: null }).mockResolvedValue(1);
    await componente.subirPendientes(1);
    await componente.subirPendientes(1);
    const [primero, otra, reintento] = subirFoto.mock.calls;
    expect(primero[1]).toBe('a.jpg');
    expect(primero[3]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(reintento[1]).toBe('a.jpg');
    expect(reintento[3]).toBe(primero[3]);
    expect(otra[3]).not.toBe(primero[3]);
  });

  it('fase 2 (C5): sin permiso no se ofrece "Agregar fotos"; mientras se edita, la foto espera a Guardar', () => {
    abrir(1);
    expect(fixture.nativeElement.textContent).not.toContain('Agregar fotos');
    fixture.componentRef.setInput('puedeAgregar', true);
    fixture.componentRef.setInput('diferirSubida', true);
    componente.encolar('a.jpg', 'QUJD');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Agregar fotos');
    expect(fixture.nativeElement.textContent).toContain('Se sube al guardar el registro');
    expect(fixture.nativeElement.textContent).not.toContain('Reintentar subida');
    componente.reintentar();
    expect(subirFoto).not.toHaveBeenCalled();
  });

  it('visor: el foco va a «Cerrar» al abrir y Escape lo cierra', async () => {
    abrir(1);
    componente.encolar('tapa.jpg', 'QUJD');
    fixture.detectChanges();
    const ver = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.trim() === 'Ver');
    ver?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const visor = fixture.nativeElement.querySelector('.ft-visor') as HTMLElement;
    expect(visor).toBeTruthy();
    expect(document.activeElement?.textContent?.trim()).toBe('Cerrar');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ft-visor')).toBeNull();
  });

  it('visor: clic en el fondo lo cierra; clic en la foto no', () => {
    abrir(1);
    componente.verPendiente({ id: 1, dueno: 1, nombre: 'a.jpg', base64: 'QUJD', estado: 'pendiente', mensaje: '', operacion: '0f8e1c2a-1111-4222-8333-444455556666' });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.ft-visor img') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ft-visor')).toBeTruthy();
    (fixture.nativeElement.querySelector('.ft-visor') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ft-visor')).toBeNull();
  });

  it('M6: avisa mientras queden fotos en cola', async () => {
    const avisos: boolean[] = [];
    componente.hayPendientes.subscribe(v => avisos.push(v));
    abrir(1);
    componente.encolar('a.jpg', 'QUJD');
    fixture.detectChanges();
    subirFoto.mockResolvedValue(1);
    await componente.subirPendientes(1);
    fixture.detectChanges();
    expect(avisos).toContain(true);
    expect(avisos[avisos.length - 1]).toBe(false);
  });
  const foto = (id: number): Cal001Foto => ({ ID_FOTO_NC: id, NOMBRE_ORIGINAL: `f${id}.jpg`, MIME: 'image/jpeg', USUARIO_CREA: 'INSPECTOR', FECHA_CREA: '2026-10-20T09:20:00' });
  const botonRetirar = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).filter(b => b.textContent?.trim() === 'Retirar');

  it('en edición, retirar solo marca (sin llamar al servidor); se puede deshacer y avisa si quedaría sin fotos', async () => {
    fixture.componentRef.setInput('fotos', [foto(1)]);
    fixture.componentRef.setInput('puedeRetirar', true);
    fixture.componentRef.setInput('diferirSubida', true);
    abrir(1);
    expect(botonRetirar()[0].disabled).toBe(false);
    swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: ' borrosa ' });
    await componente.retirar(foto(1));
    fixture.detectChanges();
    expect(retirarFoto).not.toHaveBeenCalled();
    expect(componente.porRetirar()).toEqual([{ id: 1, motivo: 'borrosa' }]);
    expect(componente.vigentes()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Se retira al guardar');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('El registro no puede quedar sin fotos: deshaga un retiro antes de guardar.');
    fixture.componentRef.setInput('puedeAgregar', true);
    fixture.detectChanges();
    expect(componente.estadoRetiro()).toBe('El registro no puede quedar sin fotos: agregue otra o deshaga el retiro antes de guardar.');

    componente.encolar('nueva.jpg', 'QUJD');
    fixture.detectChanges();
    expect(componente.quedariaSinFotos()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('no puede quedar sin fotos');

    const deshacer = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.trim() === 'Deshacer');
    deshacer?.click();
    expect(componente.porRetirar()).toEqual([]);
  });

  it('Retirar y Deshacer son el mismo botón (el foco no se pierde); con 10 fotos explica que primero se guarde el retiro', async () => {
    fixture.componentRef.setInput('fotos', Array.from({ length: 10 }, (_, i) => foto(i + 1)));
    fixture.componentRef.setInput('puedeRetirar', true);
    fixture.componentRef.setInput('puedeAgregar', true);
    fixture.componentRef.setInput('diferirSubida', true);
    abrir(1);
    const boton = botonRetirar()[0];
    boton.focus();
    await componente.retirar(foto(1));
    fixture.detectChanges();
    expect(boton.isConnected).toBe(true);
    expect(boton.textContent?.trim()).toBe('Deshacer');
    expect(document.activeElement).toBe(boton);
    expect(fixture.nativeElement.textContent).not.toContain('Agregar fotos');
    expect(componente.estadoRetiro()).toBe('Con el máximo de 10 fotos, guarde primero el retiro y luego agregue la nueva.');
    boton.click();
    fixture.detectChanges();
    expect(boton.textContent?.trim()).toBe('Retirar');
    expect(componente.estadoRetiro()).toBe('');
  });

  it('retirarMarcadas aplica los retiros, avisa los rechazos (E28) y refresca; limpiar y cambiar de registro los desmarcan', async () => {
    fixture.componentRef.setInput('fotos', [foto(1), foto(2)]);
    fixture.componentRef.setInput('puedeRetirar', true);
    fixture.componentRef.setInput('diferirSubida', true);
    abrir(1);
    await componente.retirar(foto(1));
    await componente.retirar(foto(2));
    const avisos: string[] = [];
    let cambios = 0;
    componente.aviso.subscribe(m => avisos.push(m));
    componente.cambiaron.subscribe(() => cambios++);
    retirarFoto.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Cal001BackendError('El registro debe conservar al menos una foto activa'));
    expect(await componente.retirarMarcadas()).toBe(1);
    expect(retirarFoto.mock.calls).toEqual([[1, ''], [2, '']]);
    expect(avisos).toEqual(['El registro debe conservar al menos una foto activa']);
    expect(cambios).toBe(1);
    expect(componente.porRetirar()).toEqual([]);

    await componente.retirar(foto(1));
    componente.limpiar();
    expect(componente.porRetirar()).toEqual([]);
    await componente.retirar(foto(1));
    abrir(2);
    expect(componente.porRetirar()).toEqual([]);
  });

  it('fuera de edición, con dos fotos se retira al instante; si el SP rechaza (E28) avisa y refresca la lista', async () => {
    fixture.componentRef.setInput('fotos', [foto(1), foto(2)]);
    fixture.componentRef.setInput('puedeRetirar', true);
    abrir(1);
    expect(botonRetirar().map(b => b.disabled)).toEqual([false, false]);
    const avisos: string[] = [];
    let cambios = 0;
    componente.aviso.subscribe(m => avisos.push(m));
    componente.cambiaron.subscribe(() => cambios++);
    retirarFoto.mockRejectedValueOnce(new Cal001BackendError('El registro debe conservar al menos una foto activa'));
    await componente.retirar(foto(2));
    expect(retirarFoto).toHaveBeenCalledWith(2, '');
    expect(avisos).toEqual(['El registro debe conservar al menos una foto activa']);
    expect(cambios).toBe(1);
  });
});
