import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  XteinDataGridComponent,
  XteinGridToolbarAction,
  XteinInputComponent,
  XteinLabelComponent
} from '@xtein/ui';
import {
  Ven209ContactoAdicional,
  Ven209Direccion,
  Ven209Email,
  Ven209Telefono
} from '../../models/ven-209.model';
import { Ven209GridColumns } from '../../constants/ven-209-ui.constants';

@Component({
  selector: 'xtein-ven209-ubicaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinDataGridComponent,
    XteinInputComponent,
    XteinLabelComponent
  ],
  templateUrl: './xtein-ven209-ubicaciones.component.html',
  styleUrls: ['./xtein-ven209-ubicaciones.component.scss']
})
export class XteinVen209UbicacionesComponent {
  @Input() readOnly = false;
  @Input() direcciones: Ven209Direccion[] = [];
  @Input() telefonos: Ven209Telefono[] = [];
  @Input() emails: Ven209Email[] = [];
  @Input() contactoAdicional: Ven209ContactoAdicional = { URL: '', CIIU: '' };

  @Output() readonly direccionesChange = new EventEmitter<Ven209Direccion[]>();
  @Output() readonly telefonosChange = new EventEmitter<Ven209Telefono[]>();
  @Output() readonly emailsChange = new EventEmitter<Ven209Email[]>();
  @Output() readonly contactoAdicionalChange = new EventEmitter<Ven209ContactoAdicional>();

  readonly direccionColumns = Ven209GridColumns.direcciones;
  readonly telefonoColumns = Ven209GridColumns.telefonos;
  readonly emailColumns = Ven209GridColumns.emails;

  // Accordion state (matches Legacy dirtelinfo)
  readonly expanded = {
    contacto: signal(true),
    correos: signal(true),
    direcciones: signal(false),
    telefonos: signal(false)
  };

  toggleSection(section: keyof typeof this.expanded): void {
    const sig = this.expanded[section];
    sig.set(!sig());
  }

  // Quick dialogs for adding items
  readonly modalVisible = signal<'direccion' | 'telefono' | 'email' | null>(null);

  // New item buffers
  newDir: Ven209Direccion = { TIPO_DIRECCION: 'PRINCIPAL', DOMICILIO: '', BARRIO: '', NOMBRE_UBICACION: '', CODIGO_POSTAL: '' };
  newTel: Ven209Telefono = { TIPO_TELEFONO: 'CELULAR', TELEFONO: '', EXTENSION: '' };
  newEmail: Ven209Email = { EMAIL: '', ETIQUETA: 'FACTURACION' };

  readonly dirToolbarActions: XteinGridToolbarAction[] = [
    {
      id: 'add-dir',
      text: 'Agregar Dirección',
      title: 'Agregar nueva dirección',
      icon: 'plus',
      variant: 'primary',
      action: () => this.openAddModal('direccion')
    }
  ];

  readonly telToolbarActions: XteinGridToolbarAction[] = [
    {
      id: 'add-tel',
      text: 'Agregar Teléfono',
      title: 'Agregar nuevo teléfono',
      icon: 'plus',
      variant: 'primary',
      action: () => this.openAddModal('telefono')
    }
  ];

  readonly emailToolbarActions: XteinGridToolbarAction[] = [
    {
      id: 'add-email',
      text: 'Agregar Correo',
      title: 'Agregar nuevo correo electrónico',
      icon: 'plus',
      variant: 'primary',
      action: () => this.openAddModal('email')
    }
  ];

  openAddModal(type: 'direccion' | 'telefono' | 'email'): void {
    if (this.readOnly) return;
    if (type === 'direccion') {
      this.newDir = { TIPO_DIRECCION: 'PRINCIPAL', DOMICILIO: '', BARRIO: '', NOMBRE_UBICACION: '', CODIGO_POSTAL: '' };
    } else if (type === 'telefono') {
      this.newTel = { TIPO_TELEFONO: 'CELULAR', TELEFONO: '', EXTENSION: '' };
    } else {
      this.newEmail = { EMAIL: '', ETIQUETA: 'FACTURACION' };
    }
    this.modalVisible.set(type);
  }

  closeModal(): void {
    this.modalVisible.set(null);
  }

  saveNewDireccion(): void {
    if (!this.newDir.DOMICILIO?.trim()) return;
    const updated = [...this.direcciones, { ...this.newDir, ID_DIRECCION: Date.now() }];
    this.direccionesChange.emit(updated);
    this.closeModal();
  }

  removeDireccion(item: Ven209Direccion): void {
    if (this.readOnly) return;
    const updated = this.direcciones.filter(d => d !== item && d.ID_DIRECCION !== item.ID_DIRECCION);
    this.direccionesChange.emit(updated);
  }

  saveNewTelefono(): void {
    if (!this.newTel.TELEFONO?.trim()) return;
    const updated = [...this.telefonos, { ...this.newTel, ID_TELEFONO: Date.now() }];
    this.telefonosChange.emit(updated);
    this.closeModal();
  }

  removeTelefono(item: Ven209Telefono): void {
    if (this.readOnly) return;
    const updated = this.telefonos.filter(t => t !== item && t.ID_TELEFONO !== item.ID_TELEFONO);
    this.telefonosChange.emit(updated);
  }

  saveNewEmail(): void {
    if (!this.newEmail.EMAIL?.trim()) return;
    const updated = [...this.emails, { ...this.newEmail, ITEM: Date.now() }];
    this.emailsChange.emit(updated);
    this.closeModal();
  }

  removeEmail(item: Ven209Email): void {
    if (this.readOnly) return;
    const updated = this.emails.filter(e => e !== item && e.ITEM !== item.ITEM);
    this.emailsChange.emit(updated);
  }

  updateContacto(): void {
    this.contactoAdicionalChange.emit({ ...this.contactoAdicional });
  }
}
