import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import {
  DxButtonModule,
  DxLoadIndicatorModule,
  DxTooltipModule,
  DxTreeViewModule
} from 'devextreme-angular';

import {
  ApplicationTreeNode
} from '@xtein/sdk';

import {
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  ApplicationNavigationService
} from '../services/application-navigation.service';


/**
 * Represents the minimum DevExtreme TreeView click event
 * information required by the XTEIN navigation component.
 */
interface NavigationItemClickEvent {

  /**
   * Application-tree node associated with the clicked item.
   */
  itemData?:
    ApplicationTreeNode;
}


/**
 * Main navigation sidebar of the XTEIN Shell.
 *
 * The component presents the authenticated application tree
 * and requests the workspace to open application nodes selected
 * by the user.
 *
 * Backend communication and application-tree state remain
 * delegated to the platform navigation services.
 */
@Component({
  selector:
    'app-sidebar',

  standalone:
    true,

  imports: [
    DxButtonModule,
    DxLoadIndicatorModule,
    DxTooltipModule,
    DxTreeViewModule
  ],

  templateUrl:
    './sidebar.component.html',

  styleUrl:
    './sidebar.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Sidebar
  implements OnInit {

  /**
   * Logical root identifier returned by the XTEIN backend.
   */
  readonly treeRootValue =
    'XTEIN';


  /**
   * Default XTEIN icon used for modules without
   * a configured database icon.
   */
  private readonly defaultModuleIcon =
    'xt-icon-module';


  /**
   * Default XTEIN icon used for applications without
   * a configured database icon.
   */
  private readonly defaultApplicationIcon =
    'xt-icon-application';


  /**
   * Indicates whether the sidebar is currently collapsed.
   */
  @Input()
  collapsed =
    false;


  /**
   * Requests the Shell layout to change the sidebar state.
   */
  @Output()
  readonly collapsedChange =
    new EventEmitter<boolean>();


  /**
   * Error generated while attempting to open an application.
   *
   * Navigation loading errors remain owned by
   * ApplicationNavigationService.
   */
  launchError:
    string | null =
      null;


  /**
   * DevExtreme TreeView search editor configuration.
   */
  readonly searchEditorOptions = {

    placeholder:
      'Buscar...',

    showClearButton:
      true
  };


  constructor(
    private readonly navigationService:
      ApplicationNavigationService,

    private readonly workspaceRuntime:
      WorkspaceRuntimeService
  ) {
  }


  /**
   * Current normalized application tree.
   *
   * DevExtreme TreeView expects a mutable array for its items input.
   * The collection itself continues to be controlled exclusively
   * by ApplicationNavigationService.
   */
  get navigationItems():
    ApplicationTreeNode[] {

    return this.navigationService
      .items();
  }


  /**
   * Indicates whether navigation is currently loading.
   */
  get loading():
    boolean {

    return this.navigationService
      .loading();
  }


  /**
   * Current navigation loading error.
   */
  get error():
    string | null {

    return this.navigationService
      .error();
  }


  /**
   * Loads the authenticated user's navigation tree.
   */
  ngOnInit():
    void {

    if (
      this.navigationItems.length ===
        0
    ) {

      this.navigationService
        .load();
    }
  }


  /**
   * Toggles the sidebar state.
   */
  toggleSidebar():
    void {

    this.collapsedChange.emit(
      !this.collapsed
    );
  }


  /**
   * Processes a navigation-tree item click.
   *
   * Module nodes remain navigation containers and are not
   * opened inside the workspace.
   *
   * All other nodes are delegated to WorkspaceRuntimeService.
   * The workspace runtime guarantees that an application can
   * only have one open tab.
   *
   * @param event DevExtreme navigation item click event.
   */
  onNavigationItemClick(
    event:
      NavigationItemClickEvent
  ): void {

    const item =
      event.itemData;


    if (!item) {

      return;
    }


    /*
     * Modules are navigation containers.
     *
     * DevExtreme handles their expand/collapse behavior.
     */
    if (
      this.isModule(
        item
      )
    ) {

      return;
    }


    this.launchError =
      null;


    try {

      this.workspaceRuntime
        .openApplication({

          applicationId:
            item.applicationId,

          title:
            item.name,

          icon:
            item.icon
        });

    } catch (error) {

      this.launchError =
        this.resolveLaunchErrorMessage(
          error,
          item
        );


      console.error(
        'XTEIN application opening failed.',
        {
          applicationId:
            item.applicationId,

          applicationName:
            item.name,

          remote:
            item.remote,

          error
        }
      );
    }
  }


  /**
   * Returns the CSS icon class used to display a navigation node.
   *
   * A configured database icon has priority. When none is available,
   * modules and applications receive different fallback icons.
   *
   * @param item Application-tree node.
   * @returns CSS icon class.
   */
  resolveIconClass(
    item:
      ApplicationTreeNode
  ): string {

    const configuredIcon =
      item.icon
        ?.trim();


    if (configuredIcon) {

      return configuredIcon;
    }


    return this.isModule(
      item
    )
      ? this.defaultModuleIcon
      : this.defaultApplicationIcon;
  }


  /**
   * Indicates whether a navigation node represents a module.
   *
   * @param item Application-tree node.
   * @returns True for module nodes.
   */
  isModule(
    item:
      ApplicationTreeNode
  ): boolean {

    return item.type
      .trim()
      .toLowerCase() ===
      'modulo';
  }


  /**
   * Creates a stable DOM identifier for the navigation item.
   *
   * This identifier is used by DevExtreme Tooltip when the
   * sidebar is collapsed.
   *
   * @param item Application-tree node.
   * @returns Safe DOM element identifier.
   */
  getItemElementId(
    item:
      ApplicationTreeNode
  ): string {

    const normalizedId =
      item.applicationId
        .trim()
        .replace(
          /[^a-zA-Z0-9_-]/g,
          '-'
        );


    return `xt-navigation-${normalizedId}`;
  }


  /**
   * Returns the DevExtreme Tooltip target selector
   * associated with a navigation item.
   *
   * @param item Application-tree node.
   * @returns CSS selector.
   */
  getTooltipTarget(
    item:
      ApplicationTreeNode
  ): string {

    return `#${
      this.getItemElementId(
        item
      )
    }`;
  }


  /**
   * Converts an application opening error into a user-facing message.
   *
   * @param error Runtime error.
   * @param item Application that could not be opened.
   * @returns Error description.
   */
  private resolveLaunchErrorMessage(
    error:
      unknown,

    item:
      ApplicationTreeNode
  ): string {

    if (
      typeof error ===
        'object' &&
      error !==
        null &&
      'message' in error
    ) {

      const message =
        (
          error as {
            message?: unknown;
          }
        ).message;


      if (
        typeof message ===
          'string' &&
        message.trim()
      ) {

        return message;
      }
    }


    return (
      `No fue posible abrir la aplicación ` +
      `${item.name} (${item.applicationId}).`
    );
  }
}