import { signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { ToolbarAction, type ToolbarCommand, type ToolbarState } from '@xtein/sdk';
import { ToolbarRuntimeService, WorkspaceRuntimeService } from '@xtein/runtime';
import { SessionService } from '@xtein/session';
import { XteinNotificationService } from '@xtein/ui';
import { Cal001Component } from './cal-001.component';
import { XteinCal001FotosComponent } from './components/xtein-cal001-fotos/xtein-cal001-fotos.component';
import type { Cal001Borrador, Cal001Permisos, Cal001RegistroCompleto } from './models/cal-001.model';
import { Cal001Service } from './services/cal-001.service';
import { CausasPrueba, PartesPrueba, borradorProduccion, registroGuardado } from './testing/cal-001.fixtures';
import { Cal001BackendError } from './utils/cal-001-errores';
import { hoyColombia } from './utils/cal-001-fecha';

// La pantalla usa controles nativos; de @xtein/ui solo usa el servicio de notificaciones (sustituido abajo).
// Las pruebas no dibujan DevExtreme: como en mfe-adm, se sustituyen los paquetes que @xtein/ui carga al importarse.
const clases = vi.hoisted(() => (nombres: string[]) => Object.fromEntries(nombres.map(nombre => [nombre, class {}])));
vi.mock('devextreme-angular', () => clases(['BarGauge', 'Button', 'Chart', 'CheckBox', 'DataGrid', 'DateBox', 'DropDownBox', 'HtmlEditor',
  'PieChart', 'Popup', 'RadioGroup', 'Scheduler', 'SelectBox', 'Switch', 'TagBox', 'TextBox', 'TreeView', 'Template']
  .flatMap(nombre => ['Dx' + nombre + 'Module', 'Dx' + nombre + 'Component'])));
vi.mock('devextreme-angular/ui/number-box', () => clases(['DxNumberBoxModule', 'DxNumberBoxComponent']));
vi.mock('devextreme-angular/ui/text-area', () => clases(['DxTextAreaModule', 'DxTextAreaComponent']));
vi.mock('devextreme-angular/ui/load-panel', () => clases(['DxLoadPanelModule', 'DxLoadPanelComponent']));
vi.mock('devextreme-angular/core', () => clases(['DxTemplateDirective']));
vi.mock('devextreme-angular/ui/nested', () => clases(['DxiButton', 'DxiColumn', 'DxiItem', 'DxiValidationRule', 'DxoEditing', 'DxoFilterRow',
  'DxoGrouping', 'DxoHeaderFilter', 'DxoImageUpload', 'DxoLookup', 'DxoMediaResizing', 'DxoPager', 'DxoPaging', 'DxoScrolling',
  'DxoSearchPanel', 'DxoSelection', 'DxoToolbar'].map(nombre => nombre + 'Component')));
vi.mock('devexpress-dashboard-angular', () => clases(['DxDashboardControlModule', 'DxDashboardControlComponent']));
vi.mock('devextreme/ui/notify', () => ({ default: () => undefined }));
vi.mock('devextreme/data/custom_store', () => ({ default: class {} }));
vi.mock('devextreme/data/data_source', () => ({ default: class {} }));
const swal = vi.hoisted(() => ({ fire: vi.fn(async (): Promise<{ isConfirmed: boolean; value?: string }> => ({ isConfirmed: false })) }));
vi.mock('sweetalert2', () => ({ default: swal }));

describe('Cal001Component', () => {
  let fixture: ComponentFixture<Cal001Component>;
  let component: Cal001Component;
  let estados: ToolbarState[];
  let comandosBarra: Subject<ToolbarCommand>;
  let notificacion: Record<'success' | 'info' | 'warning' | 'error', ReturnType<typeof vi.fn>>;
  const servicio = {
    permisos: vi.fn<() => Promise<Cal001Permisos>>(),
    causas: vi.fn(async () => CausasPrueba),
    listasCliente: vi.fn(async () => ({ AREAS_DETECCION: [{ ITEM: 1, VALOR: 'Visita al cliente' }], FUENTES: [{ ITEM: 1, VALOR: 'Visita técnica' }] })),
    partesProducto: vi.fn(async () => PartesPrueba),
    registro: vi.fn(async () => registroGuardado()),
    consulta: vi.fn(),
    guardar: vi.fn(),
    agregar: vi.fn(),
    subirFoto: vi.fn(async () => 1),
    retirarFoto: vi.fn(async () => undefined)
  };

  async function crear(permisos: Cal001Permisos, antes: () => void = () => undefined): Promise<void> {
    try { localStorage.clear(); } catch { /* jsdom sin almacenamiento */ }
    antes();
    swal.fire.mockClear();
    servicio.guardar.mockReset();
    servicio.agregar.mockReset();
    servicio.subirFoto.mockReset();
    servicio.subirFoto.mockResolvedValue(1);
    servicio.retirarFoto.mockClear();
    servicio.permisos.mockResolvedValue(permisos);
    estados = [];
    comandosBarra = new Subject<ToolbarCommand>();
    notificacion = { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [Cal001Component],
      providers: [
        { provide: ToolbarRuntimeService, useValue: { setState: (s: ToolbarState) => estados.push(s), removeApplication: vi.fn(), commandsForApplication: () => comandosBarra } },
        { provide: WorkspaceRuntimeService, useValue: { setDirty: vi.fn(), getApplicationTitle: () => 'No Conformidades' } },
        { provide: SessionService, useValue: { session: signal({ userId: 'LAURA', userName: 'Laura Gómez', companyId: '00' }) } },
        { provide: XteinNotificationService, useValue: notificacion }
      ]
    });
    TestBed.overrideComponent(Cal001Component, { set: { providers: [{ provide: Cal001Service, useValue: servicio }] } });
    fixture = TestBed.createComponent(Cal001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const panel = (): HTMLElement => fixture.nativeElement.querySelector('#c1-panel-registro');
  const ultimoEstado = (): ToolbarState => estados[estados.length - 1];
  const controlesEditables = (): Element[] => Array.from(panel().querySelectorAll('input, select, textarea'))
    .filter(control => !(control as HTMLInputElement).readOnly && !(control as HTMLInputElement).disabled);

  afterEach(() => fixture?.destroy());

  it('sin ES_GESTOR el registro guardado se abre en solo lectura, también el propio (historia 3)', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro({ ...registroGuardado(), REGISTRO: { ...registroGuardado().REGISTRO, USUARIO_CREA: 'LAURA' } }, PartesPrueba);
    fixture.detectChanges();

    expect(component.editable()).toBe(false);
    expect(controlesEditables()).toEqual([]);
    expect(panel().textContent).toContain('Solo lectura: solo el gestor de calidad modifica registros.');
    expect(panel().querySelector('xtein-cal001-buscador')).toBeNull();
    expect(Array.from(panel().querySelectorAll('button')).some(b => /Quitar|Agregar/.test(b.textContent ?? ''))).toBe(false);

    expect(ultimoEstado().actions[ToolbarAction.Edit]?.visible ?? false).toBe(false);
    component.modificar();
    expect(component.editable()).toBe(false);
  });

  it('sin ES_GESTOR el origen Cliente no se ofrece al crear', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.nuevo();
    fixture.detectChanges();
    const opciones = Array.from(panel().querySelectorAll('select option')).map(o => o.textContent?.trim());
    expect(opciones).toContain('Producción');
    expect(opciones).not.toContain('Cliente');
    component.campo('ORIGEN', 'CLIENTE');
    expect(component.borrador()?.ORIGEN).toBe('PRODUCCION');
  });

  it('el gestor puede modificar y la barra ofrece Modificar, nunca r_configurar', async () => {
    servicio.registro.mockResolvedValueOnce(registroGuardado({ PUEDE_MODIFICAR: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    fixture.detectChanges();
    expect(ultimoEstado().actions[ToolbarAction.Edit]?.visible).toBe(true);
    expect(estados.some(estado => estado.actions[ToolbarAction.Configure]?.visible)).toBe(false);
    expect(estados.some(estado => estado.actions[ToolbarAction.Delete]?.visible)).toBe(false);

    component.modificar();
    fixture.detectChanges();
    expect(component.modificando()).toBe(true);
    expect(controlesEditables().length).toBeGreaterThan(0);
    expect(ultimoEstado().actions[ToolbarAction.Save]?.enabled).toBe(true);
    expect(ultimoEstado().actions[ToolbarAction.Configure]?.visible ?? false).toBe(false);
  });

  it('A2: el formulario de origen Cliente no muestra "Ocurrencias sin operario" y pide los 6 datos de la garantía', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    component.nuevo();
    component.campo('ORIGEN', 'CLIENTE');
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = panel().textContent ?? '';
    expect(texto).toContain('Datos de la garantía (origen Cliente)');
    for (const etiqueta of ['Cliente', 'Número de servicio', 'Área de detección', 'Fuente', 'Fecha del reclamo', 'Causa del cliente']) {
      expect(texto).toContain(etiqueta);
    }
    expect(texto.toLowerCase()).not.toContain('ocurrencias sin operario');
    const etiquetas = Array.from(panel().querySelectorAll('[aria-label], label span')).map(e => (e.getAttribute('aria-label') ?? e.textContent ?? '').toLowerCase());
    expect(etiquetas.some(e => e.includes('ocurrencias'))).toBe(false);
  });

  it('la Pieza limita a 50 caracteres y el panel se llama "No conformidades por operario"', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.nuevo();
    component.borrador.update(b => b ? { ...b, PRODUCTO: 'PF-2201', NOMBRE_PRODUCTO: 'Nochero', PARTES: [
      { CLAVE: 'PA-501|1', ID_PARTE_NC: null, ID_PARTE: 'PA-501', ITEM_PRODUCTO_PARTE: 1, NOMBRE_PARTE: 'Tapa', PIEZA: '', CAUSAS: [] }
    ] } : b);
    fixture.detectChanges();
    const pieza = panel().querySelector<HTMLInputElement>('xtein-cal001-partes input')!;
    expect(pieza.getAttribute('maxlength')).toBe('50');
    pieza.value = 'x'.repeat(60);
    pieza.dispatchEvent(new Event('input'));
    expect(component.borrador()?.PARTES[0].PIEZA).toHaveLength(50);
    expect(fixture.nativeElement.textContent).toContain('No conformidades por operario');
    expect(fixture.nativeElement.textContent).not.toContain('Ocurrencias por operario');
  });

  it('el borrador del registro nuevo se guarda con la clave de empresa y usuario', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
      component.nuevo();
      component.campo('OBSERVACION', 'Arenilla en la tapa');
      fixture.detectChanges();
      vi.advanceTimersByTime(600);
      const guardado = JSON.parse(localStorage.getItem('cal001-borrador:00:LAURA') ?? 'null');
      expect(guardado?.BORRADOR?.OBSERVACION).toBe('Arenilla en la tapa');
    } finally {
      vi.useRealTimers();
    }
  });

  /** Registro nuevo válido (para guardar) con fecha del evento de hoy. */
  const capturaValida = (): void => {
    component.nuevo();
    component.borrador.set({ ...borradorProduccion(), FECHA_EVENTO: hoyColombia() });
  };
  /** Componente de fotos de la pantalla (para elegir fotos como lo haría el usuario). */
  const componenteFotos = (): XteinCal001FotosComponent =>
    fixture.debugElement.query(By.directive(XteinCal001FotosComponent)).componentInstance as XteinCal001FotosComponent;
  const elegirFoto = (nombre = 'tapa.jpg'): void => {
    fixture.detectChanges();
    componenteFotos().encolar(nombre, 'QUJD');
    fixture.detectChanges();
  };

  it('guardar: un doble clic envía una sola vez', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    let responder: (v: unknown) => void = () => undefined;
    servicio.guardar.mockImplementation(() => new Promise(r => { responder = r; }));
    capturaValida();
    elegirFoto();
    const primero = component.guardar();
    const segundo = component.guardar();
    await segundo;
    expect(servicio.guardar).toHaveBeenCalledTimes(1);
    responder({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 1 });
    await primero;
    expect(servicio.guardar).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('cal001-borrador:00:LAURA')).toBeNull();
  });

  it('guardar con E22: muestra el conflicto de versión con la opción de recargar y sigue en modificación', async () => {
    servicio.registro.mockResolvedValueOnce(conFoto({ PUEDE_MODIFICAR: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    component.modificar();
    component.borrador.update(b => b ? { ...b, FECHA_EVENTO: hoyColombia() } : b);
    servicio.guardar.mockRejectedValueOnce(new Cal001BackendError('Modificado por ANDRES el 2026-10-26T10:00:00; recargue'));
    await component.guardar();
    expect(component.modificando()).toBe(true);
    expect(component.errores()[0]).toContain('Modificado por ANDRES el 2026-10-26T10:00:00');
    expect(swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'El registro cambió', confirmButtonText: 'Recargar registro' }));
  });

  it('M3: sin permiso de crear el borrador guardado no se ofrece y se borra', async () => {
    const clave = 'cal001-borrador:00:LAURA';
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 0, ES_GESTOR: 0 }, () => localStorage.setItem(clave,
      JSON.stringify({ CLAVE: clave, GUARDADO_EN: new Date().toISOString(), BORRADOR: borradorProduccion() })));
    expect(swal.fire).not.toHaveBeenCalled();
    expect(localStorage.getItem(clave)).toBeNull();
  });

  it('M3: con permiso de crear se ofrece y, si se descarta, se borra', async () => {
    const clave = 'cal001-borrador:00:LAURA';
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 }, () => localStorage.setItem(clave,
      JSON.stringify({ CLAVE: clave, GUARDADO_EN: new Date().toISOString(), BORRADOR: borradorProduccion() })));
    await new Promise(r => setTimeout(r));
    expect(swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Borrador sin guardar' }));
    expect(localStorage.getItem(clave)).toBeNull();
  });

  /* ================================ Fase 2 ================================ */

  const botones = (patron: RegExp): HTMLButtonElement[] =>
    Array.from(panel().querySelectorAll<HTMLButtonElement>('button')).filter(b => patron.test(b.textContent ?? ''));
  const conFoto = (cambios: Parameters<typeof registroGuardado>[0]) => ({
    ...registroGuardado(cambios),
    FOTOS: [{ ID_FOTO_NC: 5, NOMBRE_ORIGINAL: 'tapa.jpg', MIME: 'image/jpeg', USUARIO_CREA: 'INSPECTOR', FECHA_CREA: '2026-10-20T09:20:00' }]
  });

  it('C5: en consulta no aparecen subir ni retirar fotos; aparecen al pulsar Modificar', async () => {
    servicio.registro.mockResolvedValueOnce(conFoto({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR_FOTOS: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    fixture.detectChanges();
    expect(component.puedeAgregarFotos()).toBe(false);
    expect(component.puedeRetirarFotos()).toBe(false);
    expect(panel().textContent).toContain('tapa.jpg');
    expect(panel().textContent).not.toContain('Agregar fotos');
    expect(botones(/Retirar/)).toEqual([]);

    component.modificar();
    fixture.detectChanges();
    expect(panel().textContent).toContain('Agregar fotos');
    expect(botones(/Retirar/).length).toBe(1);
  });

  it('C5: al crear se pueden agregar fotos, pero no retirar', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.nuevo();
    fixture.detectChanges();
    expect(component.puedeAgregarFotos()).toBe(true);
    expect(component.puedeRetirarFotos()).toBe(false);
  });

  it('C6: un registro nuevo no muestra "Documento", "Fecha de registro", "Última modificación" ni el aviso de modo; "Registrado por" es el usuario actual', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.nuevo();
    fixture.detectChanges();
    const etiquetas = Array.from(panel().querySelectorAll('.c1-campo > span')).map(e => e.textContent?.trim());
    expect(etiquetas).not.toContain('Documento');
    expect(etiquetas).not.toContain('Fecha de registro');
    expect(etiquetas).not.toContain('Última modificación');
    expect(panel().textContent).not.toContain('Se asigna al guardar');
    expect(panel().textContent).not.toContain('Al guardar');
    expect(panel().textContent).not.toContain('Registro nuevo:');
    expect(panel().querySelector('.c1-modo')).toBeNull();
    expect(etiquetas).toContain('Registrado por');
    const campo = Array.from(panel().querySelectorAll<HTMLLabelElement>('label.c1-campo')).find(l => l.textContent?.includes('Registrado por'));
    expect(campo?.querySelector('input')?.value).toBe('Laura Gómez');
    // La fecha del evento ya no es obligatoria (vacía → hoy en el SP).
    expect(panel().querySelector('input[type=date][required]')).toBeNull();
  });

  it('C6: un registro guardado muestra "Última modificación" y "Registrado por" con nombre · área (código en title)', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado(), PartesPrueba);
    fixture.detectChanges();
    const campos = Array.from(panel().querySelectorAll<HTMLLabelElement>('label.c1-campo'));
    expect(campos.some(l => l.textContent?.includes('Última modificación'))).toBe(true);
    const documento = campos.find(l => l.textContent?.includes('Documento'))?.querySelector('input');
    expect(documento?.value).toBe(registroGuardado().REGISTRO.DOCUMENTO);
    expect(panel().querySelector('.c1-modo')?.textContent).toContain('Consultando');
    const fechaRegistro = campos.find(l => l.textContent?.includes('Fecha de registro'))?.querySelector('input');
    expect(fechaRegistro?.value).toBeTruthy();
    expect(fechaRegistro?.value).not.toBe('Al guardar');
    const registrado = campos.find(l => l.textContent?.includes('Registrado por'))?.querySelector('input');
    expect(registrado?.value).toBe('Edgardo Alcazar · Producción');
    expect(registrado?.getAttribute('title')).toBe('INSPECTOR');
    expect(panel().textContent).toContain('registrado por Edgardo Alcazar · Producción');
  });

  it('agregar a su registro va por el lápiz de la barra: solo con PUEDE_AGREGAR = 1, con el aviso de hasta cuándo y sin botón propio', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 0 }), PartesPrueba);
    fixture.detectChanges();
    expect(ultimoEstado().actions[ToolbarAction.Edit]?.visible ?? false).toBe(false);
    comandosBarra.next({ applicationId: 'x', action: ToolbarAction.Edit });
    expect(component.agregando()).toBe(false);

    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1, AGREGAR_HASTA: '2026-10-27T09:15:00' }), PartesPrueba);
    fixture.detectChanges();
    expect(ultimoEstado().actions[ToolbarAction.Edit]?.visible).toBe(true);
    expect(ultimoEstado().actions[ToolbarAction.Edit]?.enabled).toBe(true);
    expect(botones(/Agregar a mi registro/)).toEqual([]);
    expect(panel().textContent).toContain('use Modificar en la barra');
    expect(panel().textContent).toContain('Puede agregar hasta 27/10/2026 09:15.');
  });

  it('el gestor con PUEDE_MODIFICAR y PUEDE_AGREGAR: el lápiz modifica, no agrega', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    component.mostrarRegistro(registroGuardado({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR: 1 }), PartesPrueba);
    fixture.detectChanges();
    comandosBarra.next({ applicationId: 'x', action: ToolbarAction.Edit });
    expect(component.modificando()).toBe(true);
    expect(component.agregando()).toBe(false);
  });

  it('modo Agregar: lo guardado queda de solo lectura, la barra ofrece Guardar sin Modificar y "No agregó nada" si no hay cambios', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1, PUEDE_AGREGAR_FOTOS: 1 }), PartesPrueba);
    fixture.detectChanges();
    comandosBarra.next({ applicationId: 'x', action: ToolbarAction.Edit });
    fixture.detectChanges();

    expect(component.agregando()).toBe(true);
    expect(component.editable()).toBe(false);
    expect(component.modificando()).toBe(false);
    expect(ultimoEstado().actions[ToolbarAction.Save]?.enabled).toBe(true);
    expect(ultimoEstado().actions[ToolbarAction.Cancel]?.enabled).toBe(true);
    expect(ultimoEstado().actions[ToolbarAction.Edit]?.visible ?? false).toBe(false);
    expect(component.puedeAgregarFotos()).toBe(true);
    expect(component.puedeRetirarFotos()).toBe(false);
    // Encabezado de solo lectura; la causa guardada no se puede quitar ni bajar sus ocurrencias.
    const detalle = panel().querySelector('xtein-cal001-detalle-parte') as HTMLElement;
    expect(detalle.textContent).toContain('Guardada');
    expect(Array.from(detalle.querySelectorAll('button')).some(b => /Quitar|✕/.test(b.textContent ?? ''))).toBe(false);
    expect(detalle.querySelector('[aria-label="Ocurrencias de Óscar Villa"]')).toBeNull();
    expect(detalle.querySelector('[aria-label="Ocurrencias adicionales de Óscar Villa"]')).not.toBeNull();
    expect(panel().querySelector<HTMLTextAreaElement>('textarea[aria-label="Observación"]')?.readOnly).toBe(true);
    component.campo('OBSERVACION', 'cambio');
    expect(component.borrador()?.OBSERVACION).toBe('Lote revisado');

    await component.guardar();
    expect(servicio.agregar).not.toHaveBeenCalled();
    expect(notificacion.warning).toHaveBeenCalledWith('No agregó nada.');
    expect(component.agregando()).toBe(true);
  });

  it('modo Agregar: Guardar envía agregar, avisa "actualizado (versión N)", vuelve a consulta y recarga el registro', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    // Con una foto activa no se exige otra (evidencia ya presente).
    component.mostrarRegistro(conFoto({ PUEDE_AGREGAR: 1 }), PartesPrueba);
    component.agregar();
    fixture.detectChanges();
    const adicionales = panel().querySelector<HTMLInputElement>('[aria-label="Ocurrencias adicionales de Óscar Villa"]') as HTMLInputElement;
    adicionales.value = '2';
    adicionales.dispatchEvent(new Event('input'));
    servicio.agregar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 2, REPETIDA: 0 });
    servicio.registro.mockClear();

    await component.guardar();
    expect(servicio.agregar).toHaveBeenCalledTimes(1);
    const [borrador, original] = servicio.agregar.mock.calls[0] as [Cal001Borrador, Cal001RegistroCompleto];
    expect(borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES).toBe(2);
    expect(original.REGISTRO.ID_REGISTRO_NC).toBe(7);
    expect(notificacion.success).toHaveBeenCalledWith('NC-0007 actualizado (versión 2).');
    expect(component.agregando()).toBe(false);
    expect(component.modo()).toBe('browsing');
    expect(servicio.registro).toHaveBeenCalledWith(7);
  });

  it('modo Agregar con E22: ofrece recargar y, si sigue, conserva lo capturado', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(conFoto({ PUEDE_AGREGAR: 1 }), PartesPrueba);
    component.agregar();
    const parte = component.borrador()!.PARTES[0];
    component.cambiarParte({ ...parte, CAUSAS: parte.CAUSAS.map(c => ({ ...c, OPERARIOS: c.OPERARIOS.map(o => ({ ...o, ADICIONALES: 1 })) })) });
    servicio.agregar.mockRejectedValueOnce(new Cal001BackendError('Modificado por ANDRES el 2026-10-26T10:00:00; recargue'));
    await component.guardar();
    expect(swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'El registro cambió', confirmButtonText: 'Recargar registro' }));
    expect(component.agregando()).toBe(true);
    expect(component.borrador()?.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES).toBe(1);
  });

  it('cancelar Agregar vuelve a consulta sin cambios', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1 }), PartesPrueba);
    component.agregar();
    swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    await component.cancelar();
    expect(component.agregando()).toBe(false);
    expect(component.modo()).toBe('browsing');
    expect(component.enCaptura()).toBe(false);
  });
  /* ======================= Foto de evidencia obligatoria ======================= */

  it('foto obligatoria: un registro nuevo sin foto no se envía y lo dice', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    capturaValida();
    fixture.detectChanges();
    await component.guardar();
    expect(servicio.guardar).not.toHaveBeenCalled();
    expect(component.errores()).toEqual(['Agregue al menos una foto de evidencia.']);
    expect(notificacion.warning).toHaveBeenCalledWith('Agregue al menos una foto de evidencia.');
    expect(component.creando()).toBe(true);
  });

  it('foto obligatoria: Modificar un registro antiguo sin fotos exige una antes de guardar', async () => {
    servicio.registro.mockResolvedValueOnce(registroGuardado({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR_FOTOS: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    component.modificar();
    component.borrador.update(b => b ? { ...b, FECHA_EVENTO: hoyColombia() } : b);
    fixture.detectChanges();
    await component.guardar();
    expect(servicio.guardar).not.toHaveBeenCalled();
    expect(component.errores()).toEqual(['El registro no tiene fotos: agregue al menos una foto de evidencia.']);
    expect(component.modificando()).toBe(true);
  });

  it('retirar la única foto al modificar: sin otra no deja guardar; al cancelar la foto se conserva', async () => {
    servicio.registro.mockResolvedValueOnce(conFoto({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR_FOTOS: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    component.modificar();
    component.borrador.update(b => b ? { ...b, FECHA_EVENTO: hoyColombia() } : b);
    fixture.detectChanges();
    swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: '' });
    await componenteFotos().retirar(component.registro()!.FOTOS[0]);
    await component.guardar();
    expect(servicio.guardar).not.toHaveBeenCalled();
    expect(servicio.retirarFoto).not.toHaveBeenCalled();
    expect(component.errores()).toEqual(['El registro no puede quedar sin fotos: deshaga el retiro o agregue otra foto.']);

    swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    await component.cancelar();
    fixture.detectChanges();
    expect(componenteFotos().porRetirar()).toEqual([]);
    expect(servicio.retirarFoto).not.toHaveBeenCalled();
    expect(panel().textContent).toContain('tapa.jpg');
    expect(panel().textContent).not.toContain('Se retira al guardar');
  });

  it('mientras se suben las fotos de un guardado, la barra no abre otra edición', async () => {
    const { restaurar } = await reemplazarUnicaFoto('');
    try {
      let liberar: () => void = () => undefined;
      servicio.subirFoto.mockImplementation(() => new Promise<number>(r => { liberar = () => r(9); }));
      const guardado = component.guardar();
      await vi.waitFor(() => expect(servicio.subirFoto).toHaveBeenCalled());
      expect(component.guardandoFotos()).toBe(true);
      comandosBarra.next({ applicationId: 'x', action: ToolbarAction.Edit });
      expect(component.modificando()).toBe(false);
      liberar();
      await guardado;
      expect(component.guardandoFotos()).toBe(false);
      expect(servicio.retirarFoto).toHaveBeenCalledWith(5, '');
      expect(notificacion.success).toHaveBeenCalledWith('Foto retirada.');
    } finally {
      restaurar();
    }
  });

  /**
   * Modificar un registro con una sola foto, marcarla para retirar y elegir otra. El registro (con su foto) se
   * devuelve en todas las cargas; `restaurar()` vuelve los mocks a su estado por defecto para las pruebas siguientes.
   */
  async function reemplazarUnicaFoto(motivo: string): Promise<{ restaurar: () => void }> {
    servicio.registro.mockResolvedValue(conFoto({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR_FOTOS: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    const restaurar = (): void => {
      servicio.registro.mockReset();
      servicio.registro.mockImplementation(async () => registroGuardado());
      servicio.retirarFoto.mockReset();
      servicio.retirarFoto.mockImplementation(async () => undefined);
    };
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    component.modificar();
    component.borrador.update(b => b ? { ...b, FECHA_EVENTO: hoyColombia() } : b);
    fixture.detectChanges();
    swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: motivo });
    await componenteFotos().retirar(component.registro()!.FOTOS[0]);
    elegirFoto('nueva.jpg');
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 2 });
    return { restaurar };
  }

  it('reemplazar la única foto al modificar: Guardar sube la nueva y después retira la vieja', async () => {
    const { restaurar } = await reemplazarUnicaFoto('borrosa');
    try {
      const orden: string[] = [];
      servicio.subirFoto.mockImplementation(async () => { orden.push('subir'); return 9; });
      servicio.retirarFoto.mockImplementation(async () => { orden.push('retirar'); });
      await component.guardar();
      expect(orden).toEqual(['subir', 'retirar']);
      expect(servicio.retirarFoto).toHaveBeenCalledWith(5, 'borrosa');
    } finally {
      restaurar();
    }
  });

  it('reemplazar la única foto: si la nueva no se sube, no se retira la vieja', async () => {
    const { restaurar } = await reemplazarUnicaFoto('');
    try {
      servicio.subirFoto.mockRejectedValue({ status: 0, error: null });
      await component.guardar();
      expect(servicio.retirarFoto).not.toHaveBeenCalled();
      expect(notificacion.warning).toHaveBeenCalledWith(expect.stringContaining('No se retiró ninguna foto'));
    } finally {
      restaurar();
    }
  });

  it('foto obligatoria: si la única foto de un registro nuevo no se sube, avisa con el documento y deja Reintentar', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    capturaValida();
    elegirFoto();
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 1 });
    servicio.subirFoto.mockRejectedValue(new Cal001BackendError('Sin permiso para agregar fotos'));
    await component.guardar();
    fixture.detectChanges();
    const mensaje = 'NC-0007 quedó guardado sin foto: la subida falló. Pulse «Reintentar subida» antes de salir.';
    expect(component.errores()).toEqual([mensaje]);
    expect(notificacion.error).toHaveBeenCalledWith(mensaje);
    expect(componenteFotos().cola().map(f => [f.dueno, f.estado])).toEqual([[7, 'error']]);
    expect(panel().textContent).toContain('Reintentar subida');
  });

  it('foto obligatoria: si se sube al menos una de varias, no se dice que quedó sin foto', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    capturaValida();
    elegirFoto('a.jpg');
    elegirFoto('b.jpg');
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 1 });
    servicio.subirFoto.mockRejectedValueOnce(new Cal001BackendError('Sin permiso para agregar fotos')).mockResolvedValue(1);
    await component.guardar();
    expect(servicio.subirFoto).toHaveBeenCalledTimes(2);
    expect(notificacion.error).not.toHaveBeenCalledWith(expect.stringContaining('sin foto'));
  });

  it('foto obligatoria: Agregar solo fotos a un registro sin fotos que no se suben avisa sin decir "guardado"', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1, PUEDE_AGREGAR_FOTOS: 1 }), PartesPrueba);
    component.agregar();
    elegirFoto();
    servicio.subirFoto.mockRejectedValue(new Cal001BackendError('Sin permiso para agregar fotos'));
    await component.guardar();
    expect(servicio.agregar).not.toHaveBeenCalled();
    expect(component.errores()[0]).toBe('Las fotos de NC-0007 no se subieron. Pulse «Reintentar subida» antes de salir.');
  });

  it('foto obligatoria: con fotos sin subir, abrir otro registro o Nuevo pregunta y al volver no se descartan', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    capturaValida();
    elegirFoto();
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 1 });
    servicio.subirFoto.mockRejectedValue(new Cal001BackendError('Sin permiso para agregar fotos'));
    await component.guardar();
    swal.fire.mockClear();
    servicio.registro.mockClear();

    await component.abrirRegistro(8);
    expect(swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Fotos sin subir', text: expect.stringContaining('1 foto sin subir de NC-0007') }));
    expect(servicio.registro).not.toHaveBeenCalled();

    component.nuevo();
    await new Promise(r => setTimeout(r));
    expect(swal.fire).toHaveBeenCalledTimes(2);
    expect(component.creando()).toBe(false);
    expect(componenteFotos().pendientes().length).toBe(1);
  });

  it('foto obligatoria: Cancelar la modificación con fotos en cola dice cuántas se descartan', async () => {
    servicio.registro.mockResolvedValueOnce(conFoto({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR_FOTOS: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    component.modificar();
    elegirFoto();
    swal.fire.mockClear();
    await component.cancelar();
    expect(swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: '¿Cancelar la modificación sin guardar? Se descarta 1 foto sin subir.' }));
  });
  it('foto obligatoria: Modificar con foto nueva cuya subida falla en un registro sin fotos dice "sigue sin foto"', async () => {
    servicio.registro.mockResolvedValue(registroGuardado({ PUEDE_MODIFICAR: 1, PUEDE_AGREGAR_FOTOS: 1, PUEDE_RETIRAR_FOTOS: 1 }));
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 1 });
    await component.abrirRegistro(7);
    component.modificar();
    component.borrador.update(b => b ? { ...b, FECHA_EVENTO: hoyColombia() } : b);
    elegirFoto();
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 2 });
    servicio.subirFoto.mockRejectedValue(new Cal001BackendError('Sin permiso para agregar fotos'));
    await component.guardar();
    expect(component.errores()).toEqual(['NC-0007 sigue sin foto: la subida falló. Pulse «Reintentar subida» antes de salir.']);
    servicio.registro.mockReset();
    servicio.registro.mockImplementation(async () => registroGuardado());
  });

  it('foto obligatoria: al confirmar "Descartar y continuar" se abre el otro registro y las fotos sin subir se descartan', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    capturaValida();
    elegirFoto();
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 1 });
    servicio.subirFoto.mockRejectedValue(new Cal001BackendError('Sin permiso para agregar fotos'));
    await component.guardar();
    expect(componenteFotos().pendientes().length).toBe(1);
    servicio.registro.mockClear();
    swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    await component.abrirRegistro(8);
    expect(servicio.registro).toHaveBeenCalledWith(8);
    expect(componenteFotos().pendientes()).toEqual([]);
  });

  it('foto obligatoria: recargar el registro propio con su foto pendiente no pregunta', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    capturaValida();
    elegirFoto();
    servicio.guardar.mockResolvedValueOnce({ ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', VERSION: 1 });
    servicio.subirFoto.mockRejectedValue(new Cal001BackendError('Sin permiso para agregar fotos'));
    await component.guardar();
    swal.fire.mockClear();
    await component.recargarRegistro();
    expect(swal.fire).not.toHaveBeenCalled();
    expect(componenteFotos().pendientes().length).toBe(1);
  });
});
