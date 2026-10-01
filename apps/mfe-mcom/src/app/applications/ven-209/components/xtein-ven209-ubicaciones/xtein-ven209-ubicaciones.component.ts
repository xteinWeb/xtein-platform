import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  XteinDireccionesComponent,
  XteinCorreosComponent,
  XteinDataGridComponent,
  XteinGridToolbarAction,
  XteinInputComponent,
  XteinLabelComponent,
  XteinSelectComponent,
  XteinNotificationService
} from '@xtein/ui';
import {
  Ven209ContactoAdicional,
  Ven209Direccion,
  Ven209Email,
  Ven209Telefono
} from '../../models/ven-209.model';
import { Ven209GridColumns } from '../../constants/ven-209-ui.constants';

export interface Ven209TelefonoDraft extends Ven209Telefono {
  originalId?: number;
  isNew?: boolean;
}

@Component({
  selector: 'xtein-ven209-ubicaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinDireccionesComponent,
    XteinCorreosComponent,
    XteinDataGridComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinSelectComponent
  ],
  templateUrl: './xtein-ven209-ubicaciones.component.html',
  styleUrls: ['./xtein-ven209-ubicaciones.component.scss']
})
export class XteinVen209UbicacionesComponent implements OnChanges {
  @Input() readOnly = false;
  @Input() direcciones: Ven209Direccion[] = [];
  @Input() telefonos: Ven209Telefono[] = [];
  @Input() emails: Ven209Email[] = [];
  @Input() contactoAdicional: Ven209ContactoAdicional = { URL: '', CIIU: '' };

  @Output() readonly direccionesChange = new EventEmitter<Ven209Direccion[]>();
  @Output() readonly telefonosChange = new EventEmitter<Ven209Telefono[]>();
  @Output() readonly emailsChange = new EventEmitter<Ven209Email[]>();
  @Output() readonly contactoAdicionalChange = new EventEmitter<Ven209ContactoAdicional>();

  @Output() readonly pendingChange = new EventEmitter<void>();
  @ViewChild(XteinDireccionesComponent) private addresses?: XteinDireccionesComponent;
  commitPendingAddresses(): boolean {
    const committed = this.addresses?.commit() ?? true;
    if (!committed) this.expanded.direcciones.set(true);
    return committed;
  }
  @ViewChild('telGrid') private telGrid?: XteinDataGridComponent;

  readonly telefonoColumns = Ven209GridColumns.telefonos;

  readonly tiposTelefono = ['CELULAR', 'FIJO', 'OFICINA', 'FAX', 'OTRO'];

  // Accordion state
  readonly expanded = {
    contacto: signal(true),
    correos: signal(true),
    direcciones: signal(true),
    telefonos: signal(true)
  };

  // Grid rows
  telRows: Ven209Telefono[] = [];

  // Selections
  selectedTelefonos: number[] = [];

  // Drafts
  telDraft: Ven209TelefonoDraft | null = null;

  // Toolbars
  telToolbarActions: XteinGridToolbarAction[] = [];

  constructor(private readonly notification: XteinNotificationService) {}

  ngOnChanges(): void {
    if (this.readOnly) {
      this.cancelTelefonoDraft();
      this.selectedTelefonos = [];
    }
    this.rebuildTelefonos();
  }

  toggleSection(section: keyof typeof this.expanded): void {
    const sig = this.expanded[section];
    sig.set(!sig());
  }

  updateContacto(): void {
    this.contactoAdicionalChange.emit({ ...this.contactoAdicional });
  }

  private ensureTelKeys(list: Ven209Telefono[]): Ven209Telefono[] {
    let max = 0;
    for (const t of list) {
      if (t.ID_TELEFONO && t.ID_TELEFONO > max) max = t.ID_TELEFONO;
    }
    return list.map(t => {
      if (!t.ID_TELEFONO) {
        max++;
        return { ...t, ID_TELEFONO: max };
      }
      return t;
    });
  }

  rebuildTelefonos(): void {
    const list = this.ensureTelKeys(this.telefonos);
    this.selectedTelefonos = this.selectedTelefonos.filter(key => list.some(t => t.ID_TELEFONO === key));
    this.telRows = this.telDraft
      ? [this.telDraft, ...list.filter(t => t.ID_TELEFONO !== this.telDraft?.originalId)]
      : [...list];
    this.updateTelToolbar();
  }

  onTelefonoSelectionChanged(keys: unknown[]): void {
    this.selectedTelefonos = (keys as number[]).filter(
      id => id !== -9999 && this.telefonos.some(t => t.ID_TELEFONO === id)
    );
    this.updateTelToolbar();
  }

  private updateTelToolbar(): void {
    this.telToolbarActions = this.readOnly
      ? []
      : [
          {
            id: 'add-tel',
            icon: 'plus',
            variant: 'primary',
            title: 'Nuevo Teléfono',
            disabled: !!this.telDraft,
            action: () => this.beginAddTelefono()
          },
          {
            id: 'edit-tel',
            icon: 'edit',
            variant: 'secondary',
            title: 'Editar teléfono seleccionado',
            visible: this.selectedTelefonos.length === 1 && !this.telDraft,
            action: () => {
              const found = this.telefonos.find(t => t.ID_TELEFONO === this.selectedTelefonos[0]);
              if (found) this.beginEditTelefono(found);
            }
          },
          {
            id: 'save-tel',
            icon: 'check',
            variant: 'success',
            title: 'Guardar Teléfono',
            visible: !!this.telDraft,
            action: () => this.commitTelefono()
          },
          {
            id: 'cancel-tel',
            icon: 'undo',
            variant: 'cancel',
            title: 'Cancelar',
            visible: !!this.telDraft,
            action: () => this.cancelTelefonoDraft()
          },
          {
            id: 'delete-tel',
            icon: 'trash',
            variant: 'danger',
            title: 'Eliminar teléfonos seleccionados',
            visible: this.selectedTelefonos.length > 0 && !this.telDraft,
            action: () => {
              void this.removeSelectedTelefonos();
            }
          }
        ];
  }

  beginAddTelefono(): void {
    if (this.readOnly || this.telDraft) return;
    this.telDraft = {
      ID_TELEFONO: -9999,
      TIPO_TELEFONO: 'CELULAR',
      TELEFONO: '',
      EXTENSION: '',
      isNew: true
    };
    this.rebuildTelefonos();
    this.telGrid?.resetView();
  }

  beginEditTelefono(row: Ven209Telefono): void {
    if (this.readOnly || this.telDraft) return;
    this.telDraft = {
      ...row,
      originalId: row.ID_TELEFONO,
      isNew: false
    };
    this.rebuildTelefonos();
  }

  commitTelefono(): void {
    if (this.readOnly || !this.telDraft) return;
    const telStr = (this.telDraft.TELEFONO || '').trim();
    if (!telStr) {
      this.notification.warning('El número telefónico es obligatorio.');
      return;
    }

    const isNew = this.telDraft.isNew;
    const originalId = this.telDraft.originalId;

    let updatedList = [...this.telefonos];
    if (isNew) {
      let max = Math.max(0, ...updatedList.map(t => t.ID_TELEFONO || 0));
      updatedList.push({
        ID_TELEFONO: max + 1,
        TIPO_TELEFONO: this.telDraft.TIPO_TELEFONO || 'CELULAR',
        TELEFONO: telStr,
        EXTENSION: (this.telDraft.EXTENSION || '').trim()
      });
    } else {
      updatedList = updatedList.map(t => {
        if (t.ID_TELEFONO === originalId) {
          return {
            ...t,
            TIPO_TELEFONO: this.telDraft!.TIPO_TELEFONO || 'CELULAR',
            TELEFONO: telStr,
            EXTENSION: (this.telDraft!.EXTENSION || '').trim()
          };
        }
        return t;
      });
    }

    this.telDraft = null;
    this.telefonos = updatedList;
    this.telefonosChange.emit(this.telefonos);
    this.rebuildTelefonos();
  }

  cancelTelefonoDraft(): void {
    this.telDraft = null;
    this.rebuildTelefonos();
  }

  async removeSelectedTelefonos(): Promise<void> {
    if (this.readOnly || !this.selectedTelefonos.length) return;
    const confirm = await Swal.fire({
      title: '¿Eliminar teléfonos?',
      text:
        this.selectedTelefonos.length === 1
          ? '¿Desea eliminar el teléfono seleccionado?'
          : `¿Desea eliminar los ${this.selectedTelefonos.length} teléfonos seleccionados?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });
    if (!confirm.isConfirmed || this.readOnly) return;

    const toDelete = new Set(this.selectedTelefonos);
    this.telefonos = this.telefonos.filter(t => !toDelete.has(t.ID_TELEFONO!));
    this.selectedTelefonos = [];
    this.telefonosChange.emit(this.telefonos);
    this.rebuildTelefonos();
  }
}
