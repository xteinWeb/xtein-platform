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
import { Adm015UNAsociadaRecord } from '../../models/adm-015.model';

export interface Adm015UNAsociadaDraft extends Adm015UNAsociadaRecord {
  originalUnId?: string;
}

@Component({
  selector: 'xtein-adm015-un-asociadas',
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
  templateUrl: './xtein-adm015-un-asociadas.component.html',
  styleUrls: ['./xtein-adm015-un-asociadas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015UnAsociadasComponent implements OnChanges {
  @Input() unAsociadas: Adm015UNAsociadaRecord[] = [];
  @Input() readOnly = true;
  @Input() busy = false;
  @Input() availableUNs: { ID_UN: string; NOMBRE: string }[] = [];

  @Output() readonly unAsociadasChange = new EventEmitter<Adm015UNAsociadaRecord[]>();
  @Output() readonly draftChange = new EventEmitter<Adm015UNAsociadaDraft | null>();

  @ViewChild('unGrid') private grid?: XteinDataGridComponent;

  draft: Adm015UNAsociadaDraft | null = null;
  rows: Adm015UNAsociadaRecord[] = [];
  selected: string[] = [];
  listOpened = false;
  choices: { ID_UN: string; NOMBRE: string }[] = [];
  choiceKeys: string[] = [];
  selectableUNs: { ID_UN: string; NOMBRE: string }[] = [];
  toolbarActions: XteinGridToolbarAction[] = [];

  readonly columns: XteinGridColumn<Adm015UNAsociadaRecord, string>[] = [
    {
      caption: 'Unidades de Negocios Asociadas',
      alignment: 'center',
      columns: [
        {
          dataField: 'ID_UN_ASOCIADA',
          caption: 'Unidad de Negocio Asociada',
          width: 220,
          cellTemplate: 'xteinGroup'
        },
        {
          dataField: 'NOMBRE',
          caption: 'Nombre',
          minWidth: 260
        },
        {
          dataField: 'VALOR_DEFECTO',
          caption: 'UN Operativa',
          alignment: 'center',
          width: 160,
          cellTemplate: 'xteinGroup'
        }
      ]
    }
  ];

  readonly choiceColumns: XteinGridColumn<{ ID_UN: string; NOMBRE: string }, string>[] = [
    { dataField: 'ID_UN', caption: 'Unidad de Negocio', width: 140 },
    { dataField: 'NOMBRE', caption: 'Nombre', minWidth: 220 }
  ];

  readonly lookupColumns: XteinGridColumn<{ ID_UN: string; NOMBRE: string }>[] = [
    { dataField: 'ID_UN', caption: 'Unidad de Negocio', width: 140 },
    { dataField: 'NOMBRE', caption: 'Nombre', minWidth: 220 }
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
    this.unAsociadas = this.ensureItems(this.unAsociadas);
    this.selected = this.selected.filter(key => this.unAsociadas.some(row => row.ID_UN_ASOCIADA === key));
    this.rebuild();
  }

  private ensureItems(list: Adm015UNAsociadaRecord[]): Adm015UNAsociadaRecord[] {
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
    this.selected = keys.filter(id => id !== '__draft__' && this.unAsociadas.some(row => row.ID_UN_ASOCIADA === id));
    this.updateToolbar();
  }

  private updateToolbar(): void {
    this.toolbarActions = this.readOnly ? [] : [
      {
        id: 'add',
        icon: 'plus',
        variant: 'primary',
        title: 'Asociar Unidad de Negocio',
        disabled: this.busy || !!this.draft || this.selectableUNs.length === 0,
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
        title: 'Eliminar unidades seleccionadas',
        visible: this.selected.length > 0 && !this.draft,
        disabled: this.busy,
        action: () => { void this.removeSelected(); }
      }
    ];
  }

  private rebuild(): void {
    const assigned = new Set(this.unAsociadas.map(row => row.ID_UN_ASOCIADA));
    const seen = new Set<string>();
    this.selectableUNs = this.availableUNs.filter(un => {
      if (seen.has(un.ID_UN)) return false;
      seen.add(un.ID_UN);
      return !assigned.has(un.ID_UN) || un.ID_UN === this.draft?.originalUnId;
    });

    this.choices = this.listOpened ? [...this.selectableUNs] : [];
    this.updateToolbar();

    this.rows = this.draft
      ? [this.draft, ...this.unAsociadas.filter(row => row.ID_UN_ASOCIADA !== this.draft?.originalUnId)]
      : [...this.unAsociadas];
  }

  begin(): void {
    if (this.readOnly || this.busy || this.draft || !this.selectableUNs.length) return;
    this.setDraft({
      ITEM: -9999,
      ID_UN: '',
      ID_UN_ASOCIADA: '__draft__',
      NOMBRE: '',
      USUARIO: '',
      VALOR_DEFECTO: this.unAsociadas.length === 0,
      isEdit: true
    });
    this.grid?.resetView();
  }

  beginEdit(row: Adm015UNAsociadaRecord): void {
    if (this.readOnly || this.busy || this.draft) return;
    this.setDraft({
      ...row,
      originalUnId: row.ID_UN_ASOCIADA,
      isEdit: true
    });
    this.grid?.resetView();
  }

  setDraft(value: Adm015UNAsociadaDraft | null): void {
    if (this.readOnly || this.busy) return;
    this.draft = value;
    this.draftChange.emit(value);
    this.rebuild();
  }

  chooseUN(id: unknown): void {
    if (!this.draft || this.readOnly || this.busy) return;
    const found = this.selectableUNs.find(u => u.ID_UN === id);
    if (found) {
      this.setDraft({
        ...this.draft,
        ID_UN_ASOCIADA: found.ID_UN,
        NOMBRE: found.NOMBRE
      });
    }
  }

  commit(): void {
    if (this.readOnly || this.busy || !this.draft) return;
    if (!this.draft.ID_UN_ASOCIADA || this.draft.ID_UN_ASOCIADA === '__draft__') {
      this.notification.warning('Seleccione una Unidad de Negocio.');
      return;
    }
    if (this.unAsociadas.some(u => u.ID_UN_ASOCIADA === this.draft?.ID_UN_ASOCIADA && u.ID_UN_ASOCIADA !== this.draft?.originalUnId)) {
      this.notification.warning('La Unidad de Negocio ya está asociada.');
      return;
    }

    const { originalUnId, ...record } = this.draft;
    let updated: Adm015UNAsociadaRecord[];

    if (originalUnId !== undefined) {
      updated = this.unAsociadas.map(u => u.ID_UN_ASOCIADA === originalUnId ? { ...record, isEdit: true } : u);
    } else {
      const maxItem = Math.max(0, ...this.unAsociadas.map(u => u.ITEM || 0));
      updated = [...this.unAsociadas, { ...record, ITEM: maxItem + 1, isEdit: true }];
    }

    // Si este nuevo/editado registro tiene VALOR_DEFECTO activo, desactivar los demás
    if (record.VALOR_DEFECTO) {
      const targetCode = record.ID_UN_ASOCIADA;
      updated = updated.map(u => u.ID_UN_ASOCIADA === targetCode ? u : { ...u, VALOR_DEFECTO: false });
    }

    this.setDraft(null);
    this.unAsociadas = updated;
    this.rebuild();
    this.unAsociadasChange.emit(this.unAsociadas);
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
    let updated = this.unAsociadas.filter(u => !toDelete.has(u.ID_UN_ASOCIADA));

    if (updated.length > 0 && !updated.some(u => u.VALOR_DEFECTO)) {
      updated[0] = { ...updated[0], VALOR_DEFECTO: true, isEdit: true };
    }

    this.selected = [];
    this.unAsociadas = updated;
    this.rebuild();
    this.unAsociadasChange.emit(this.unAsociadas);
  }

  openList(opened: boolean): void {
    this.listOpened = opened && !this.readOnly && !this.busy && !this.draft;
    this.choiceKeys = [];
    this.choices = this.listOpened ? [...this.selectableUNs] : [];
  }

  acceptList(): void {
    if (this.readOnly || this.busy || this.draft || !this.choiceKeys.length) return;
    const currentAssigned = new Set(this.unAsociadas.map(u => u.ID_UN_ASOCIADA));
    let maxItem = Math.max(0, ...this.unAsociadas.map(u => u.ITEM || 0));
    const newRecords: Adm015UNAsociadaRecord[] = [];

    for (const code of this.choiceKeys) {
      if (currentAssigned.has(code)) continue;
      const found = this.availableUNs.find(u => u.ID_UN === code);
      if (!found) continue;
      maxItem++;
      newRecords.push({
        ITEM: maxItem,
        ID_UN: '',
        ID_UN_ASOCIADA: found.ID_UN,
        NOMBRE: found.NOMBRE,
        USUARIO: '',
        VALOR_DEFECTO: this.unAsociadas.length === 0 && newRecords.length === 0,
        isEdit: true
      });
    }

    if (newRecords.length > 0) {
      this.unAsociadas = [...this.unAsociadas, ...newRecords];
      this.rebuild();
      this.unAsociadasChange.emit(this.unAsociadas);
    }
    this.openList(false);
  }

  onToggleOperativa(record: Adm015UNAsociadaRecord, value: boolean): void {
    if (this.readOnly || this.busy) return;
    if (this.draft && record === this.draft) {
      this.draft = { ...this.draft, VALOR_DEFECTO: value };
      this.rebuild();
      return;
    }

    this.unAsociadas = this.unAsociadas.map(item => {
      if (item.ID_UN_ASOCIADA === record.ID_UN_ASOCIADA) {
        return { ...item, VALOR_DEFECTO: value, isEdit: true };
      }
      if (value) {
        return { ...item, VALOR_DEFECTO: false, isEdit: true };
      }
      return item;
    });

    this.rebuild();
    this.unAsociadasChange.emit([...this.unAsociadas]);
  }
}
