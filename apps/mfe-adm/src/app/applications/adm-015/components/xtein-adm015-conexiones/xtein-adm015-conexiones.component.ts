import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxSwitchModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import {
  XteinButtonComponent,
  XteinDataGridComponent,
  XteinDropDownPanelComponent,
  XteinGridColumn,
  XteinGridToolbarAction,
  XteinLookupComponent,
  XteinNotificationService
} from '@xtein/ui';
import { Adm015ConexionRecord } from '../../models/adm-015.model';

export interface Adm015ConexionDraft extends Adm015ConexionRecord {
  originalConexionId?: string;
}

@Component({
  selector: 'xtein-adm015-conexiones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxSwitchModule,
    XteinButtonComponent,
    XteinDataGridComponent,
    XteinDropDownPanelComponent,
    XteinLookupComponent
  ],
  templateUrl: './xtein-adm015-conexiones.component.html',
  styleUrls: ['./xtein-adm015-conexiones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015ConexionesComponent implements OnChanges {
  @Input() conexiones: Adm015ConexionRecord[] = [];
  @Input() readOnly = true;
  @Input() busy = false;
  @Input() availableConexiones: { ID_CONEXION: string; NOMBRE?: string }[] = [];

  @Output() readonly conexionesChange = new EventEmitter<Adm015ConexionRecord[]>();
  @Output() readonly draftChange = new EventEmitter<Adm015ConexionDraft | null>();

  @ViewChild('connGrid') private grid?: XteinDataGridComponent;

  draft: Adm015ConexionDraft | null = null;
  rows: Adm015ConexionRecord[] = [];
  selected: string[] = [];
  listOpened = false;
  choices: { ID_CONEXION: string; NOMBRE?: string }[] = [];
  choiceKeys: string[] = [];
  selectableConexiones: { ID_CONEXION: string; NOMBRE?: string }[] = [];
  toolbarActions: XteinGridToolbarAction[] = [];

  readonly columns: XteinGridColumn<Adm015ConexionRecord, string>[] = [
    {
      caption: 'Conexiones',
      alignment: 'center',
      columns: [
        {
          dataField: 'ID_CONEXION',
          caption: 'Conexión',
          width: 220,
          cellTemplate: 'xteinGroup'
        },
        {
          dataField: 'ULTIMA',
          caption: 'Defecto',
          alignment: 'center',
          width: 140,
          cellTemplate: 'xteinGroup'
        },
        {
          dataField: 'ULTIMA_UN',
          caption: 'Última UN',
          minWidth: 200
        }
      ]
    }
  ];

  readonly choiceColumns: XteinGridColumn<{ ID_CONEXION: string; NOMBRE?: string }, string>[] = [
    { dataField: 'ID_CONEXION', caption: 'Conexión' }
  ];

  readonly lookupColumns: XteinGridColumn<{ ID_CONEXION: string; NOMBRE?: string }>[] = [
    { dataField: 'ID_CONEXION', caption: 'Conexión' }
  ];

  constructor(private readonly notification: XteinNotificationService) {}

  ngOnChanges(): void {
    this.synchronizeInputs();
  }

  synchronizeInputs(): void {
    if (this.readOnly) {
      this.selected = [];
      this.draft = null;
      this.listOpened = false;
    }
    this.conexiones = this.ensureItems(this.conexiones);
    this.selected = this.selected.filter(key => this.conexiones.some(row => row.ID_CONEXION === key));
    this.rebuild();
  }

  private ensureItems(list: Adm015ConexionRecord[]): Adm015ConexionRecord[] {
    let max = 0;
    for (const item of list) {
      if (item.ITEM && item.ITEM > max) max = item.ITEM;
    }
    return list.map((item) => {
      if (!item.ITEM) {
        max++;
        return { ...item, ITEM: max };
      }
      return item;
    });
  }

  onSelectionChanged(keys: string[]): void {
    this.selected = keys.filter(id => id !== '__draft__' && this.conexiones.some(row => row.ID_CONEXION === id));
    this.updateToolbar();
  }

  private updateToolbar(): void {
    this.toolbarActions = this.readOnly ? [] : [
      {
        id: 'add',
        icon: 'plus',
        variant: 'primary',
        title: 'Asociar Conexión',
        disabled: this.busy || !!this.draft || this.selectableConexiones.length === 0,
        action: () => this.begin()
      },
      {
        id: 'save',
        icon: 'check',
        variant: 'success',
        title: 'Aceptar',
        visible: !!this.draft,
        disabled: this.busy,
        action: () => this.commit()
      },
      {
        id: 'cancel',
        icon: 'undo',
        variant: 'cancel',
        title: 'Cancelar',
        visible: !!this.draft,
        disabled: this.busy,
        action: () => this.cancelDraft()
      },
      {
        id: 'delete',
        icon: 'trash',
        variant: 'danger',
        title: 'Eliminar conexiones seleccionadas',
        visible: this.selected.length > 0 && !this.draft,
        disabled: this.busy,
        action: () => { void this.removeSelected(); }
      }
    ];
  }

  private rebuild(): void {
    const assigned = new Set(this.conexiones.map(row => row.ID_CONEXION));
    const seen = new Set<string>();
    this.selectableConexiones = this.availableConexiones.filter(conn => {
      if (seen.has(conn.ID_CONEXION)) return false;
      seen.add(conn.ID_CONEXION);
      return !assigned.has(conn.ID_CONEXION) || conn.ID_CONEXION === this.draft?.originalConexionId;
    });

    this.choices = this.listOpened ? [...this.selectableConexiones] : [];
    this.updateToolbar();

    this.rows = this.draft
      ? [this.draft, ...this.conexiones.filter(row => row.ID_CONEXION !== this.draft?.originalConexionId)]
      : [...this.conexiones];
  }

  begin(): void {
    if (this.readOnly || this.busy || this.draft || !this.selectableConexiones.length) return;
    this.setDraft({
      ITEM: -9999,
      ID_CONEXION: '__draft__',
      NOMBRE: '',
      USUARIO: '',
      ULTIMA: this.conexiones.length === 0,
      ULTIMA_UN: '',
      isEdit: true
    });
    this.grid?.resetView();
  }

  beginEdit(row: Adm015ConexionRecord): void {
    if (this.readOnly || this.busy || this.draft) return;
    this.setDraft({
      ...row,
      originalConexionId: row.ID_CONEXION,
      isEdit: true
    });
    this.grid?.resetView();
  }

  setDraft(value: Adm015ConexionDraft | null): void {
    if (this.readOnly || this.busy) return;
    this.draft = value;
    this.draftChange.emit(value);
    this.rebuild();
  }

  chooseConexion(id: unknown): void {
    if (!this.draft || this.readOnly || this.busy) return;
    const found = this.selectableConexiones.find(c => c.ID_CONEXION === id);
    if (found) {
      this.setDraft({
        ...this.draft,
        ID_CONEXION: found.ID_CONEXION,
        NOMBRE: found.NOMBRE || found.ID_CONEXION
      });
    }
  }

  commit(): void {
    if (this.readOnly || this.busy || !this.draft) return;
    if (!this.draft.ID_CONEXION || this.draft.ID_CONEXION === '__draft__') {
      this.notification.warning('Seleccione una Conexión.');
      return;
    }
    if (this.conexiones.some(c => c.ID_CONEXION === this.draft?.ID_CONEXION && c.ID_CONEXION !== this.draft?.originalConexionId)) {
      this.notification.warning('La Conexión ya está asociada.');
      return;
    }

    const { originalConexionId, ...record } = this.draft;
    let updated: Adm015ConexionRecord[];

    if (originalConexionId !== undefined) {
      updated = this.conexiones.map(c => c.ID_CONEXION === originalConexionId ? { ...record, isEdit: true } : c);
    } else {
      const maxItem = Math.max(0, ...this.conexiones.map(c => c.ITEM || 0));
      updated = [...this.conexiones, { ...record, ITEM: maxItem + 1, isEdit: true }];
    }

    // Si este registro tiene ULTIMA (defecto) activo, desactivar los demás
    if (record.ULTIMA) {
      const targetCode = record.ID_CONEXION;
      updated = updated.map(c => c.ID_CONEXION === targetCode ? c : { ...c, ULTIMA: false });
    }

    this.setDraft(null);
    this.conexiones = updated;
    this.rebuild();
    this.conexionesChange.emit(this.conexiones);
  }

  cancelDraft(): void {
    if (this.readOnly || this.busy) return;
    this.setDraft(null);
  }

  async removeSelected(): Promise<void> {
    if (this.readOnly || this.busy || this.draft || !this.selected.length) return;
    const result = await Swal.fire({
      text: '¿Desea eliminar los items seleccionados?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });
    if (!result.isConfirmed || this.readOnly || this.busy) return;

    const toDelete = new Set(this.selected);
    let updated = this.conexiones.filter(c => !toDelete.has(c.ID_CONEXION));

    if (updated.length > 0 && !updated.some(c => c.ULTIMA)) {
      updated[0] = { ...updated[0], ULTIMA: true, isEdit: true };
    }

    this.selected = [];
    this.conexiones = updated;
    this.rebuild();
    this.conexionesChange.emit(this.conexiones);
  }

  openList(opened: boolean): void {
    this.listOpened = opened && !this.readOnly && !this.busy && !this.draft;
    this.choiceKeys = [];
    this.choices = this.listOpened ? [...this.selectableConexiones] : [];
  }

  acceptList(): void {
    if (this.readOnly || this.busy || this.draft || !this.choiceKeys.length) return;
    const currentAssigned = new Set(this.conexiones.map(c => c.ID_CONEXION));
    let maxItem = Math.max(0, ...this.conexiones.map(c => c.ITEM || 0));
    const newRecords: Adm015ConexionRecord[] = [];

    for (const code of this.choiceKeys) {
      if (currentAssigned.has(code)) continue;
      const found = this.availableConexiones.find(c => c.ID_CONEXION === code);
      if (!found) continue;
      maxItem++;
      newRecords.push({
        ITEM: maxItem,
        USUARIO: '',
        ID_CONEXION: found.ID_CONEXION,
        NOMBRE: found.NOMBRE || found.ID_CONEXION,
        ULTIMA: this.conexiones.length === 0 && newRecords.length === 0,
        ULTIMA_UN: '',
        isEdit: true
      });
    }

    if (newRecords.length > 0) {
      this.conexiones = [...this.conexiones, ...newRecords];
      this.rebuild();
      this.conexionesChange.emit(this.conexiones);
    }
    this.openList(false);
  }

  onToggleDefault(record: Adm015ConexionRecord, value: boolean): void {
    if (this.readOnly || this.busy) return;
    if (this.draft && record === this.draft) {
      this.draft = { ...this.draft, ULTIMA: value };
      this.rebuild();
      return;
    }

    this.conexiones = this.conexiones.map(item => {
      if (item.ID_CONEXION === record.ID_CONEXION) {
        return { ...item, ULTIMA: value, isEdit: true };
      }
      if (value) {
        return { ...item, ULTIMA: false, isEdit: true };
      }
      return item;
    });

    this.rebuild();
    this.conexionesChange.emit([...this.conexiones]);
  }
}
