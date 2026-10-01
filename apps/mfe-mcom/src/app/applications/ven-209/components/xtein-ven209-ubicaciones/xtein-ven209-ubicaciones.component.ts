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

export interface Ven209DireccionDraft extends Ven209Direccion {
  originalId?: number;
  isNew?: boolean;
}

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

  @ViewChild('dirGrid') private dirGrid?: XteinDataGridComponent;
  @ViewChild('telGrid') private telGrid?: XteinDataGridComponent;

  readonly direccionColumns = Ven209GridColumns.direcciones;
  readonly telefonoColumns = Ven209GridColumns.telefonos;

  readonly tiposDireccion = ['PRINCIPAL', 'SUCURSAL', 'ENTREGA', 'COBRO', 'DESPACHO', 'OTRO'];
  readonly tiposTelefono = ['CELULAR', 'FIJO', 'OFICINA', 'FAX', 'OTRO'];

  // Accordion state
  readonly expanded = {
    contacto: signal(true),
    correos: signal(true),
    direcciones: signal(true),
    telefonos: signal(true)
  };

  // Grid rows
  dirRows: Ven209Direccion[] = [];
  telRows: Ven209Telefono[] = [];

  // Selections
  selectedDirecciones: number[] = [];
  selectedTelefonos: number[] = [];

  // Drafts
  dirDraft: Ven209DireccionDraft | null = null;
  telDraft: Ven209TelefonoDraft | null = null;

  // Toolbars
  dirToolbarActions: XteinGridToolbarAction[] = [];
  telToolbarActions: XteinGridToolbarAction[] = [];

  constructor(private readonly notification: XteinNotificationService) {}

  ngOnChanges(): void {
    if (this.readOnly) {
      this.cancelDireccionDraft();
      this.cancelTelefonoDraft();
      this.selectedDirecciones = [];
      this.selectedTelefonos = [];
    }
    this.rebuildDirecciones();
    this.rebuildTelefonos();
  }

  toggleSection(section: keyof typeof this.expanded): void {
    const sig = this.expanded[section];
    sig.set(!sig());
  }

  updateContacto(): void {
    this.contactoAdicionalChange.emit({ ...this.contactoAdicional });
  }

  // ==========================================
  // DIRECCIONES
  // ==========================================
  private ensureDirKeys(list: Ven209Direccion[]): Ven209Direccion[] {
    let max = 0;
    for (const d of list) {
      if (d.ID_DIRECCION && d.ID_DIRECCION > max) max = d.ID_DIRECCION;
    }
    return list.map(d => {
      if (!d.ID_DIRECCION) {
        max++;
        return { ...d, ID_DIRECCION: max };
      }
      return d;
    });
  }

  rebuildDirecciones(): void {
    const list = this.ensureDirKeys(this.direcciones);
    this.selectedDirecciones = this.selectedDirecciones.filter(key => list.some(d => d.ID_DIRECCION === key));
    this.dirRows = this.dirDraft
      ? [this.dirDraft, ...list.filter(d => d.ID_DIRECCION !== this.dirDraft?.originalId)]
      : [...list];
    this.updateDirToolbar();
  }

  onDireccionSelectionChanged(keys: unknown[]): void {
    this.selectedDirecciones = (keys as number[]).filter(
      id => id !== -9999 && this.direcciones.some(d => d.ID_DIRECCION === id)
    );
    this.updateDirToolbar();
  }

  private updateDirToolbar(): void {
    this.dirToolbarActions = this.readOnly
      ? []
      : [
          {
            id: 'add-dir',
            icon: 'plus',
            variant: 'primary',
            title: 'Nueva Dirección',
            disabled: !!this.dirDraft,
            action: () => this.beginAddDireccion()
          },
          {
            id: 'edit-dir',
            icon: 'edit',
            variant: 'secondary',
            title: 'Editar dirección seleccionada',
            visible: this.selectedDirecciones.length === 1 && !this.dirDraft,
            action: () => {
              const found = this.direcciones.find(d => d.ID_DIRECCION === this.selectedDirecciones[0]);
              if (found) this.beginEditDireccion(found);
            }
          },
          {
            id: 'save-dir',
            icon: 'check',
            variant: 'success',
            title: 'Guardar Dirección',
            visible: !!this.dirDraft,
            action: () => this.commitDireccion()
          },
          {
            id: 'cancel-dir',
            icon: 'undo',
            variant: 'cancel',
            title: 'Cancelar',
            visible: !!this.dirDraft,
            action: () => this.cancelDireccionDraft()
          },
          {
            id: 'delete-dir',
            icon: 'trash',
            variant: 'danger',
            title: 'Eliminar direcciones seleccionadas',
            visible: this.selectedDirecciones.length > 0 && !this.dirDraft,
            action: () => {
              void this.removeSelectedDirecciones();
            }
          }
        ];
  }

  beginAddDireccion(): void {
    if (this.readOnly || this.dirDraft) return;
    this.dirDraft = {
      ID_DIRECCION: -9999,
      TIPO_DIRECCION: 'PRINCIPAL',
      DOMICILIO: '',
      BARRIO: '',
      NOMBRE_UBICACION: '',
      CODIGO_POSTAL: '',
      isNew: true
    };
    this.rebuildDirecciones();
    this.dirGrid?.resetView();
  }

  beginEditDireccion(row: Ven209Direccion): void {
    if (this.readOnly || this.dirDraft) return;
    this.dirDraft = {
      ...row,
      originalId: row.ID_DIRECCION,
      isNew: false
    };
    this.rebuildDirecciones();
  }

  commitDireccion(): void {
    if (this.readOnly || !this.dirDraft) return;
    const domicilio = (this.dirDraft.DOMICILIO || '').trim();
    if (!domicilio) {
      this.notification.warning('La dirección / domicilio es obligatoria.');
      return;
    }

    const isNew = this.dirDraft.isNew;
    const originalId = this.dirDraft.originalId;

    let updatedList = [...this.direcciones];
    if (isNew) {
      let max = Math.max(0, ...updatedList.map(d => d.ID_DIRECCION || 0));
      updatedList.push({
        ID_DIRECCION: max + 1,
        TIPO_DIRECCION: this.dirDraft.TIPO_DIRECCION || 'PRINCIPAL',
        DOMICILIO: domicilio,
        BARRIO: (this.dirDraft.BARRIO || '').trim(),
        NOMBRE_UBICACION: (this.dirDraft.NOMBRE_UBICACION || '').trim(),
        CODIGO_POSTAL: (this.dirDraft.CODIGO_POSTAL || '').trim()
      });
    } else {
      updatedList = updatedList.map(d => {
        if (d.ID_DIRECCION === originalId) {
          return {
            ...d,
            TIPO_DIRECCION: this.dirDraft!.TIPO_DIRECCION || 'PRINCIPAL',
            DOMICILIO: domicilio,
            BARRIO: (this.dirDraft!.BARRIO || '').trim(),
            NOMBRE_UBICACION: (this.dirDraft!.NOMBRE_UBICACION || '').trim(),
            CODIGO_POSTAL: (this.dirDraft!.CODIGO_POSTAL || '').trim()
          };
        }
        return d;
      });
    }

    this.dirDraft = null;
    this.direcciones = updatedList;
    this.direccionesChange.emit(this.direcciones);
    this.rebuildDirecciones();
  }

  cancelDireccionDraft(): void {
    this.dirDraft = null;
    this.rebuildDirecciones();
  }

  async removeSelectedDirecciones(): Promise<void> {
    if (this.readOnly || !this.selectedDirecciones.length) return;
    const confirm = await Swal.fire({
      title: '¿Eliminar direcciones?',
      text:
        this.selectedDirecciones.length === 1
          ? '¿Desea eliminar la dirección seleccionada?'
          : `¿Desea eliminar las ${this.selectedDirecciones.length} direcciones seleccionadas?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });
    if (!confirm.isConfirmed || this.readOnly) return;

    const toDelete = new Set(this.selectedDirecciones);
    this.direcciones = this.direcciones.filter(d => !toDelete.has(d.ID_DIRECCION!));
    this.selectedDirecciones = [];
    this.direccionesChange.emit(this.direcciones);
    this.rebuildDirecciones();
  }

  // ==========================================
  // TELÉFONOS
  // ==========================================
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
