import { signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ToolbarAction, type ToolbarState } from '@xtein/sdk';
import { ToolbarRuntimeService, WorkspaceRuntimeService } from '@xtein/runtime';
import { SessionService } from '@xtein/session';
import { XteinNotificationService } from '@xtein/ui';
import { Cal001Component } from './cal-001.component';
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
const swal = vi.hoisted(() => ({ fire: vi.fn(async () => ({ isConfirmed: false })) }));
vi.mock('sweetalert2', () => ({ default: swal }));

describe('Cal001Component', () => {
  let fixture: ComponentFixture<Cal001Component>;
  let component: Cal001Component;
  let estados: ToolbarState[];
  let notificacion: Record<'success' | 'info' | 'warning' | 'error', ReturnType<typeof vi.fn>>;
  const servicio = {
    permisos: vi.fn<() => Promise<Cal001Permisos>>(),
    causas: vi.fn(async () => CausasPrueba),
    listasCliente: vi.fn(async () => ({ AREAS_DETECCION: [{ ITEM: 1, VALOR: 'Visita al cliente' }], FUENTES: [{ ITEM: 1, VALOR: 'Visita técnica' }] })),
    partesProducto: vi.fn(async () => PartesPrueba),
    registro: vi.fn(async () => registroGuardado()),
    consulta: vi.fn(),
    guardar: vi.fn(),
    agregar: vi.fn()
  };

  async function crear(permisos: Cal001Permisos, antes: () => void = () => undefined): Promise<void> {
    try { localStorage.clear(); } catch { /* jsdom sin almacenamiento */ }
    antes();
    swal.fire.mockClear();
    servicio.guardar.mockReset();
    servicio.agregar.mockReset();
    servicio.permisos.mockResolvedValue(permisos);
    estados = [];
    notificacion = { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [Cal001Component],
      providers: [
        { provide: ToolbarRuntimeService, useValue: { setState: (s: ToolbarState) => estados.push(s), removeApplication: vi.fn(), commandsForApplication: () => new Subject() } },
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

  it('guardar: un doble clic envía una sola vez', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    let responder: (v: unknown) => void = () => undefined;
    servicio.guardar.mockImplementation(() => new Promise(r => { responder = r; }));
    capturaValida();
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
    servicio.registro.mockResolvedValueOnce(registroGuardado({ PUEDE_MODIFICAR: 1 }));
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

  it('"Agregar a mi registro" solo aparece con PUEDE_AGREGAR = 1, con el aviso de hasta cuándo', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 0 }), PartesPrueba);
    fixture.detectChanges();
    expect(botones(/Agregar a mi registro/)).toEqual([]);

    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1, AGREGAR_HASTA: '2026-10-27T09:15:00' }), PartesPrueba);
    fixture.detectChanges();
    expect(botones(/Agregar a mi registro/).length).toBe(1);
    expect(panel().textContent).toContain('Puede agregar hasta 27/10/2026 09:15.');
  });

  it('modo Agregar: lo guardado queda de solo lectura, la barra ofrece Guardar sin Modificar y "No agregó nada" si no hay cambios', async () => {
    await crear({ PUEDE_VER: 1, PUEDE_CREAR: 1, ES_GESTOR: 0 });
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1, PUEDE_AGREGAR_FOTOS: 1 }), PartesPrueba);
    fixture.detectChanges();
    botones(/Agregar a mi registro/)[0].click();
    fixture.detectChanges();

    expect(component.agregando()).toBe(true);
    expect(component.editable()).toBe(false);
    expect(component.modificando()).toBe(false);
    expect(ultimoEstado().actions[ToolbarAction.Save]?.enabled).toBe(true);
    expect(ultimoEstado().actions[ToolbarAction.Cancel]?.enabled).toBe(true);
    expect(ultimoEstado().actions[ToolbarAction.Edit]?.visible ?? false).toBe(false);
    expect(botones(/Agregar a mi registro/)).toEqual([]);
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
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1 }), PartesPrueba);
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
    component.mostrarRegistro(registroGuardado({ PUEDE_AGREGAR: 1 }), PartesPrueba);
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
});
