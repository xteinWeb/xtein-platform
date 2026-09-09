import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ApplicationRegistryService, WorkspaceRuntimeService, ToolbarRuntimeService,
  RecordToolbarPermissionsService } from '@xtein/runtime';
import { DeniedRecordToolbarPermissions } from '@xtein/sdk';
import { Adm300Component } from './adm-300.component';
import { TableroDataService } from './services/tablero-data.service';

// These tests exercise application state and navigation, not DevExtreme rendering.
vi.mock('devextreme-angular', () => Object.fromEntries([
  'DxBarGauge', 'DxButton', 'DxList', 'DxPopup', 'DxHtmlEditor', 'DxChart', 'DxPieChart', 'DxScheduler'
].flatMap(name => [[name + 'Module', class {}], [name + 'Component', class {}]])));
vi.mock('devextreme-angular/core', () => ({ DxTemplateDirective: class {} }));
vi.mock('devextreme-angular/ui/nested', () => Object.fromEntries([
  'DxiAnnotation', 'DxiItem', 'DxiResource', 'DxiSeries', 'DxiValueAxis', 'DxoAnimation',
  'DxoArgumentAxis', 'DxoBorder', 'DxoCommonAnnotationSettings', 'DxoConnector', 'DxoFont',
  'DxoFormat', 'DxoGeometry', 'DxoGrid', 'DxoHoverStyle', 'DxoImageUpload', 'DxoLabel',
  'DxoLegend', 'DxoMargin', 'DxoMediaResizing', 'DxoPoint', 'DxoSmallValuesGrouping', 'DxoTick', 'DxoToolbar'
].map(name => [name + 'Component', class {}])));

describe('Tablero workspace integration', () => {
  const app = { ID_APLICACION: 'MAD-002', NOMBRE: 'Legacy name' };
  const openApplication = vi.fn();
  const removeApplication = vi.fn();
  const loadApplications = vi.fn();
  beforeEach(() => {
    openApplication.mockReset(); removeApplication.mockReset(); loadApplications.mockReset();
    loadApplications.mockReturnValue(of([app]));
    TestBed.configureTestingModule({ providers: [
      { provide: TableroDataService, useValue: { loadApplications } },
      { provide: ApplicationRegistryService, useValue: { getApplication: () => ({ applicationId: 'MAD-002', name: 'Diseñador', icon: 'edit' }) } },
      { provide: WorkspaceRuntimeService, useValue: { openApplication } },
      { provide: ToolbarRuntimeService, useValue: { setState: vi.fn(), removeApplication, commandsForApplication: () => new Subject() } },
      { provide: RecordToolbarPermissionsService, useValue: { getPermissions: () => of(DeniedRecordToolbarPermissions) } }
    ] });
  });
  const create = () => TestBed.runInInjectionContext(() => new Adm300Component());

  it('opens through the shared workspace using catalog identity and title', () => {
    const component = create();
    component.open(app);
    expect(openApplication).toHaveBeenCalledWith({ applicationId: 'MAD-002', title: 'Diseñador', icon: 'edit' });
    component.ngOnDestroy();
  });
  it('waits for favorites and choices regardless of response order', () => {
    const favorites = new Subject<typeof app[]>();
    const available = new Subject<typeof app[]>();
    loadApplications.mockImplementation(kind => kind === 'favorites' ? favorites : kind === 'available' ? available : of([]));
    const component = create();
    component.ngOnInit();
    available.next([app]); available.complete();
    favorites.next([app]); favorites.complete();
    component.editFavorites();
    expect(component.selectedFavorites).toEqual(['MAD-002']);
    component.selectedFavorites = [];
    component.applyFavorites();
    expect(component.favorites()).toEqual([]);
    expect(component.loading()).toBe(false);
    component.ngOnDestroy();
    expect(removeApplication).toHaveBeenCalledWith('ADM-300');
  });
  it('keeps the example content and notes usable when application loading fails', () => {
    loadApplications.mockReturnValue(throwError(() => new Error('offline')));
    const component = create();
    component.valueContent = '<p>Mi nota</p>';
    component.ngOnInit();
    expect(component.loading()).toBe(false);
    expect(component.errors().length).toBe(3);
    expect(component.valueContent).toBe('<p>Mi nota</p>');
    expect(component.appointmentsData.length).toBeGreaterThan(0);
    component.ngOnDestroy();
  });
  it('reorders cards without recreating notes or agenda state', () => {
    const component = create();
    component.valueContent = 'Nota';
    const appointments = component.appointmentsData;
    component.draggedCard = 0;
    component.dropCard(2, { preventDefault: vi.fn() } as unknown as DragEvent);
    expect(component.cardOrder().slice(0, 3)).toEqual([2, 1, 0]);
    expect(component.valueContent).toBe('Nota');
    expect(component.appointmentsData).toBe(appointments);
    component.ngOnDestroy();
  });
});
