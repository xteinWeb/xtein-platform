import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  Mad005Application
} from './constants/mad-005.constants';


/**
 * MAD-005 - Data Sources.
 *
 * This component represents the functional application
 * hosted by the MAD microfrontend.
 *
 * Record loading, toolbar integration, forms, validation,
 * and persistence will be added after the microfrontend
 * resolution flow has been validated end to end.
 */
@Component({
  selector:
    'mad-005',

  standalone:
    true,

  imports:
    [],

  templateUrl:
    './mad-005.component.html',

  styleUrl:
    './mad-005.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Mad005Component {

  /**
   * XTEIN application identifier.
   */
  readonly applicationId =
    Mad005Application.Id;
}