import {
  Component,
  Input
} from '@angular/core';

/**
 * Entry point exposed by the MAD microfrontend.
 *
 * The XTEIN Shell loads this component through Native Federation
 * and provides the identifier of the application that must be
 * rendered inside the MAD microfrontend.
 */
@Component({
  selector: 'mad-application-host',
  standalone: true,
  imports: [],
  templateUrl: './application-host.component.html',
  styleUrl: './application-host.component.scss'
})
export class ApplicationHostComponent {

  /**
   * XTEIN application identifier requested by the Shell.
   *
   * Examples:
   * MAD-001
   * MAD-005
   */
  @Input()
  applicationId = '';
}