import {
  Component
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Ui,
  XteinInputComponent
} from '@xtein/ui';

/**
 * Provides the main XTEIN application workspace.
 */
@Component({
  selector: 'app-workspace',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    Ui,
    XteinInputComponent
  ],

  templateUrl:
    './workspace.component.html',

  styleUrl:
    './workspace.component.scss'
})
export class Workspace {

  /**
   * Temporary form control used to validate the standard
   * XTEIN text input integration.
   */
  readonly testUserControl =
    new FormControl(
      '',
      {
        nonNullable: true
      }
    );

    /**
 * Disables the temporary XTEIN input.
 */
disableTestInput(): void {
  this.testUserControl.disable();
}
}