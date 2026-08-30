import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

/**
 * Root component of the XTEIN Shell.
 *
 * Application content is rendered exclusively through
 * the Angular Router.
 */
@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    RouterOutlet
  ],

  templateUrl:
    './app.component.html',

  styleUrl:
    './app.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class App {
}