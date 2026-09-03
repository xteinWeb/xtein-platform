import {
  ChangeDetectionStrategy,
  Component,
  signal
} from '@angular/core';

import {
  Header
} from '../header/header.component';

import {
  Sidebar
} from '../../navigation/sidebar/sidebar.component';

import {
  Workspace
} from '../../workspace/workspace/workspace.component';


/**
 * Main authenticated layout of the XTEIN Shell.
 *
 * The Shell owns global layout state because sidebar changes
 * affect the header and workspace dimensions.
 */
@Component({
  selector:
    'app-shell-layout',

  standalone:
    true,

  imports: [
    Header,
    Sidebar,
    Workspace
  ],

  templateUrl:
    './shell-layout.component.html',

  styleUrl:
    './shell-layout.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ShellLayout {

  /**
   * Indicates whether the main navigation sidebar
   * is collapsed.
   */
  readonly sidebarCollapsed =
    signal(
      false
    );


  /**
   * Updates the sidebar layout state.
   *
   * @param collapsed New collapsed state.
   */
  setSidebarCollapsed(
    collapsed:
      boolean
  ): void {

    this.sidebarCollapsed.set(
      collapsed
    );
  }
}