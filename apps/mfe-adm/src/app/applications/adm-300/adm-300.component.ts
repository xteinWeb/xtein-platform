import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { DxBarGaugeModule, DxButtonModule, DxListModule, DxPopupModule, DxHtmlEditorModule,
  DxChartModule, DxPieChartModule, DxSchedulerModule } from 'devextreme-angular';
import { ApplicationRegistryService, WorkspaceRuntimeService, ToolbarRuntimeService,
  RecordToolbarPermissionsService } from '@xtein/runtime';
import { createRecordToolbarState, DeniedRecordToolbarPermissions, RecordToolbarMode,
  RecordToolbarPermissions, ToolbarAction } from '@xtein/sdk';
import { TableroApplication, TableroDataService } from './services/tablero-data.service';
import * as demo from './constants/tablero-demo.constants';
import { TableroPurchase } from './models/tablero-purchase.model';

@Component({
  selector: 'xtein-adm-300', standalone: true,
  imports: [CommonModule, DxBarGaugeModule, DxButtonModule, DxListModule, DxPopupModule,
    DxHtmlEditorModule, DxChartModule, DxPieChartModule, DxSchedulerModule],
  templateUrl: './adm-300.component.html', styleUrl: './adm-300.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Adm300Component implements OnInit, OnDestroy {
  private readonly data = inject(TableroDataService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly workspace = inject(WorkspaceRuntimeService);
  private readonly toolbar = inject(ToolbarRuntimeService);
  private readonly permissionsService = inject(RecordToolbarPermissionsService);
  private readonly subscriptions = new Subscription();
  private loadRequest?: Subscription;
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly frequent = signal<TableroApplication[]>([]);
  readonly favorites = signal<TableroApplication[]>([]);
  readonly available = signal<TableroApplication[]>([]);
  visibleListaFav = false;
  selectedFavorites: string[] = [];
  valueContent = '';
  readonly cardOrder = signal(Array.from({ length: 9 }, (_, index) => index));
  draggedCard: number | null = null;
  readonly isMultiline = true;
  readonly currentTab: ('file' | 'url')[] = ['file', 'url'];
  readonly populationByRegions = demo.populationByRegions.map(row => ({ ...row }));
  readonly populationData = demo.populationData.map(row => ({ ...row }));
  readonly assignees = demo.assignees.map(row => ({ ...row }));
  readonly priorities = demo.priorities.map(row => ({ ...row, text: row.id === 1 ? 'Alta' : 'Baja' }));
  readonly appointmentsData = demo.appointmentsData.map(row => ({ ...row }));
  readonly currentDate = new Date(2021, 4, 11);
  readonly myCustomPalette1 = ['#2959A4', '#337AB7', '#7296C0', '#99BADD', '#CCE7FF', '#69C1D5', '#35CCAC'];
  readonly myCustomPalette2 = ['#35CCAC', '#299D9E', '#008377', '#FDC97C', '#69C1D5'];
  // The Legacy purchase request is commented out; do not invent inventory values.
  readonly DCompras: TableroPurchase[] = [];
  readonly customizeLabel = (event: { argumentText?: string; valueText?: string }): string =>
    `${event.argumentText ?? ''}\n${event.valueText ?? ''}`;

  ngOnInit(): void {
    this.publishToolbar(DeniedRecordToolbarPermissions);
    this.subscriptions.add(this.permissionsService.getPermissions('ADM-300').subscribe({
      next: permissions => this.publishToolbar(permissions),
      error: () => this.publishToolbar(DeniedRecordToolbarPermissions)
    }));
    this.subscriptions.add(this.toolbar.commandsForApplication('ADM-300').subscribe(command => {
      if (command.action === ToolbarAction.Refresh) this.refresh();
    }));
    this.refresh();
  }

  refresh(): void {
    this.loadRequest?.unsubscribe();
    this.loading.set(true);
    this.errors.set([]);
    this.visibleListaFav = false;
    const load = (kind: 'frequent' | 'favorites' | 'available', label: string) =>
      this.data.loadApplications(kind).pipe(catchError(() => {
        this.errors.update(errors => [...errors, `No fue posible cargar ${label}.`]);
        return of([] as TableroApplication[]);
      }));
    this.loadRequest = forkJoin({ frequent: load('frequent', 'las aplicaciones más usadas'),
      favorites: load('favorites', 'las favoritas'), available: load('available', 'las aplicaciones disponibles')
    }).subscribe(result => {
      this.frequent.set(result.frequent);
      this.favorites.set(result.favorites);
      this.available.set(result.available);
      this.loading.set(false);
    });
  }

  open(application: TableroApplication): void {
    const node = this.registry.getApplication(application.ID_APLICACION);
    if (!node) {
      this.errors.set(['La aplicación no está disponible en el catálogo de esta sesión.']);
      return;
    }
    try {
      this.workspace.openApplication({ applicationId: node.applicationId, title: node.name, icon: node.icon });
    } catch {
      this.errors.set(['No fue posible abrir la aplicación. Comprueba que esté activa y migrada.']);
    }
  }

  editFavorites(): void {
    this.selectedFavorites = this.favorites().map(row => row.ID_APLICACION);
    this.visibleListaFav = true;
  }

  applyFavorites(): void {
    const selected = new Set(this.selectedFavorites);
    this.favorites.set(this.available().filter(row => selected.has(row.ID_APLICACION)));
    this.visibleListaFav = false;
  }

  startCard(index: number, event: DragEvent): void {
    this.draggedCard = index;
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  dropCard(index: number, event: DragEvent): void {
    event.preventDefault();
    const source = this.draggedCard;
    this.draggedCard = null;
    if (source === null || source === index) return;
    this.cardOrder.update(order => {
      const next = [...order];
      [next[source], next[index]] = [next[index], next[source]];
      return next;
    });
  }

  private publishToolbar(permissions: RecordToolbarPermissions): void {
    this.toolbar.setState(createRecordToolbarState({ applicationId: 'ADM-300',
      mode: RecordToolbarMode.Initial, permissions, currentIndex: 0, totalRecords: 0,
      capabilities: { create: false, edit: false, delete: false, search: false, refresh: true,
        copy: false, view: false, sort: false, navigation: false, download: false, print: false, configure: false }
    }));
  }

  ngOnDestroy(): void {
    this.loadRequest?.unsubscribe();
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication('ADM-300');
  }
}
