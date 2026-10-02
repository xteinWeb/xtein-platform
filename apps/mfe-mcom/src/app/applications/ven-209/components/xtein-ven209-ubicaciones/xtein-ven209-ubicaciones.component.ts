import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  XteinDireccionesComponent,
  XteinCorreosComponent,
  XteinTelefonosComponent,
  XteinInputComponent,
  XteinLabelComponent
} from '@xtein/ui';
import {
  Ven209ContactoAdicional,
  Ven209Direccion,
  Ven209Email,
  Ven209Telefono
} from '../../models/ven-209.model';

@Component({
  selector: 'xtein-ven209-ubicaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinDireccionesComponent,
    XteinCorreosComponent,
    XteinTelefonosComponent,
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

  @Output() readonly pendingChange = new EventEmitter<void>();

  @ViewChild(XteinDireccionesComponent) private addresses?: XteinDireccionesComponent;
  @ViewChild(XteinTelefonosComponent) private phones?: XteinTelefonosComponent;

  // Accordion state
  readonly expanded = {
    contacto: signal(true),
    correos: signal(true),
    direcciones: signal(true),
    telefonos: signal(true)
  };

  commitPendingAddresses(): boolean {
    const committedAddresses = this.addresses?.commit() ?? true;
    if (!committedAddresses) this.expanded.direcciones.set(true);

    const committedPhones = this.phones?.commit() ?? true;
    if (!committedPhones) this.expanded.telefonos.set(true);

    return committedAddresses && committedPhones;
  }

  toggleSection(section: keyof typeof this.expanded): void {
    const sig = this.expanded[section];
    sig.set(!sig());
  }

  updateContacto(): void {
    this.contactoAdicionalChange.emit({ ...this.contactoAdicional });
  }
}
