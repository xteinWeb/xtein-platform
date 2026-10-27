import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Cal001Service } from '../../services/cal-001.service';
import { Cal001BackendError } from '../../utils/cal-001-errores';
import { XteinCal001FotosComponent } from './xtein-cal001-fotos.component';

describe('XteinCal001FotosComponent', () => {
  let fixture: ComponentFixture<XteinCal001FotosComponent>;
  let componente: XteinCal001FotosComponent;
  const subirFoto = vi.fn<(id: number, nombre: string, base64: string) => Promise<number>>();

  beforeEach(() => {
    subirFoto.mockReset();
    TestBed.configureTestingModule({ imports: [XteinCal001FotosComponent], providers: [{ provide: Cal001Service, useValue: { subirFoto } }] });
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
    expect(subirFoto).not.toHaveBeenCalledWith(2, expect.anything(), expect.anything());
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
    expect(subirFoto).toHaveBeenCalledWith(15, 'nueva.jpg', 'QUJD');
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
    componente.verPendiente({ id: 1, dueno: 1, nombre: 'a.jpg', base64: 'QUJD', estado: 'pendiente', mensaje: '' });
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
});
