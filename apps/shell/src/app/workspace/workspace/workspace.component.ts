import {
  Component
} from '@angular/core';

import {
  WorkspaceTab
} from '@xtein/sdk';

import {
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  WorkspaceTabHost
} from '../workspace-tab-host/workspace-tab-host.component';


/**
 * Provides the tab-based XTEIN application workspace.
 *
 * Each application can have at most one opened workspace tab.
 *
 * Inactive application hosts remain instantiated while the user
 * changes tabs so their functional state is preserved.
 */
@Component({
  selector:
    'app-workspace',

  standalone:
    true,

  imports: [
    WorkspaceTabHost
  ],

  templateUrl:
    './workspace.component.html',

  styleUrl:
    './workspace.component.scss'
})
export class Workspace {

  /**
   * Opened XTEIN workspace tabs.
   */
  readonly tabs =
    this.workspaceRuntime.tabs;


  /**
   * Identifier of the currently active application.
   */
  readonly activeApplicationId =
    this.workspaceRuntime
      .activeApplicationId;


  /**
   * Indicates whether the workspace currently contains
   * at least one opened application.
   */
  readonly hasOpenTabs =
    this.workspaceRuntime
      .hasOpenTabs;


  constructor(
    private readonly workspaceRuntime:
      WorkspaceRuntimeService
  ) {
  }


  /**
   * Activates an existing workspace application.
   *
   * Activating another application does not destroy the
   * previously active application host.
   *
   * @param tab Workspace tab to activate.
   */
  activateTab(
    tab:
      WorkspaceTab
  ): void {

    if (
      tab.applicationId ===
        this.activeApplicationId()
    ) {

      return;
    }


    this.workspaceRuntime
      .activateApplication(
        tab.applicationId
      );
  }


  /**
   * Attempts to close a workspace application.
   *
   * Dirty applications are not closed by WorkspaceRuntimeService
   * until the Shell explicitly confirms the operation.
   *
   * @param event Mouse event from the close button.
   * @param tab Workspace tab to close.
   */
  closeTab(
    event:
      MouseEvent,

    tab:
      WorkspaceTab
  ): void {

    event.stopPropagation();


    if (!tab.closable) {

      return;
    }


    this.workspaceRuntime
      .closeApplication(
        tab.applicationId
      );
  }
}