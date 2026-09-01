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
  ApplicationNavigationService
} from '../services/application-navigation.service';

/**
 * Main navigation sidebar of the XTEIN Shell.
 *
 * The component is responsible only for presenting navigation
 * and notifying user interactions.
 *
 * Backend communication and application-tree state are delegated
 * to the platform navigation services.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,

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
export class Sidebar implements OnInit {

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
  collapsed = false;

  /**
   * Requests the Shell layout to change the sidebar state.
   */
  @Output()
  readonly collapsedChange =
    new EventEmitter<boolean>();

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
      ApplicationNavigationService
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
  get loading(): boolean {

    return this.navigationService
      .loading();
  }

  /**
   * Current navigation loading error.
   */
  get error(): string | null {

    return this.navigationService
      .error();
  }

  /**
   * Loads the authenticated user's navigation tree.
   */
  ngOnInit(): void {

    if (
      this.navigationItems.length === 0
    ) {

      this.navigationService.load();
    }
  }

  /**
   * Toggles the sidebar state.
   */
  toggleSidebar(): void {

    this.collapsedChange.emit(
      !this.collapsed
    );
  }

  /**
   * Returns the CSS icon class used to display a navigation node.
   *
   * A configured database icon has priority. When none is available,
   * modules and applications receive different DevExtreme fallback icons.
   *
   * @param item Application-tree node.
   * @returns CSS icon class.
   */
  resolveIconClass(
    item: ApplicationTreeNode
  ): string {

    const configuredIcon =
      item.icon?.trim();

    if (configuredIcon) {
      return configuredIcon;
    }

    return this.isModule(item)
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
    item: ApplicationTreeNode
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
    item: ApplicationTreeNode
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
    item: ApplicationTreeNode
  ): string {

    return `#${
      this.getItemElementId(item)
    }`;
  }
}