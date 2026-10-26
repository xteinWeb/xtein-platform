import { ChangeDetectionStrategy, Component, OnChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { XteinButtonComponent, XteinCheckboxComponent, XteinDataGridComponent, XteinDropDownPanelComponent,
  XteinLookupComponent, XteinNotificationService } from '@xtein/ui';
import { Adm015ApplicationPermissionsState } from '../../services/adm-015-application-permissions.state';
import { Adm015AutorizacionRecord } from '../../models/adm-015.model';

@Component({
  selector: 'adm-015-aplicaciones', standalone: true,
  imports: [FormsModule, XteinButtonComponent, XteinCheckboxComponent, XteinDataGridComponent, XteinLookupComponent, XteinDropDownPanelComponent],
  inputs: ['autorizaciones', 'readOnly', 'busy', 'availableApps', 'draft'],
  outputs: ['autorizacionesChange', 'draftChange', 'refresh'],
  templateUrl: './adm-015-aplicaciones.component.html', styleUrls: ['./adm-015-aplicaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Adm015AplicacionesComponent extends Adm015ApplicationPermissionsState implements OnChanges {
  @ViewChild('applicationsGrid') private grid?: XteinDataGridComponent;
  ngOnChanges(): void { this.synchronizeInputs(); }
  constructor(notification: XteinNotificationService) { super(notification); }
  override begin(): void { super.begin(); if (this.draft) this.grid?.resetView(); }
  override beginEdit(row: Adm015AutorizacionRecord): void { super.beginEdit(row); if (this.draft) this.grid?.resetView(); }
}
