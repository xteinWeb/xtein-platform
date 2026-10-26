import { signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ToolbarAction, type ToolbarState } from '@xtein/sdk';
import { ToolbarRuntimeService, WorkspaceRuntimeService } from '@xtein/runtime';
import { SessionService } from '@xtein/session';
import { XteinNotificationService } from '@xtein/ui';
import { Cal001Component } from './cal-001.component';
import type { Cal001Permisos } from './models/cal-001.model';
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
  const servicio = {
    permisos: vi.fn<() => Promise<Cal001Permisos>>(),
    causas: vi.fn(async () => CausasPrueba),
    listasCliente: vi.fn(async () => ({ AREAS_DETECCION: [{ ITEM: 1, VALOR: 'Visita al cliente' }], FUENTES: [{ ITEM: 1, VALOR: 'Visita técnica' }] })),
    partesProducto: vi.fn(async () => PartesPrueba),
    registro: vi.fn(async () => registroGuardado()),
    consulta: vi.fn(),
    guardar: vi.fn()
  };

  async function crear(permisos: Cal001Permisos, antes: () => void = () => undefined): Promise<void> {
    try { localStorage.clear(); } catch { /* jsdom sin almacenamiento */ }
    antes();
    swal.fire.mockClear();
    servicio.guardar.mockReset();
    servicio.permisos.mockResolvedValue(permisos);
    estados = [];
    TestBed.configureTestingModule({
      imports: [Cal001Component],
      providers: [
        { provide: ToolbarRuntimeService, useValue: { setState: (s: ToolbarState) => estados.push(s), removeApplication: vi.fn(), commandsForApplication: () => new Subject() } },
        { provide: WorkspaceRuntimeService, useValue: { setDirty: vi.fn(), getApplicationTitle: () => 'No Conformidades' } },
        { provide: SessionService, useValue: { session: signal({ userId: 'LAURA', companyId: '00' }) } },
        { provide: XteinNotificationService, useValue: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() } }
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
});
