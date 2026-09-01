import {
  Component,
  computed
} from '@angular/core';

import {
  ToolbarAction
} from '@xtein/sdk';

import {
  ToolbarRuntimeService
} from '@xtein/runtime';

import {
  PlatformToolbarGroup,
  PlatformToolbarItem,
  PlatformToolbarItems
} from './platform-toolbar.constants';


/**
 * Represents one toolbar item after combining the
 * Shell presentation definition with the active ToolbarState.
 */
interface RenderedPlatformToolbarItem
  extends PlatformToolbarItem {

  /**
   * Indicates whether the action can currently execute.
   */
  enabled:
    boolean;

  /**
   * Indicates whether a visual separator must be rendered
   * before this item.
   */
  separatorBefore:
    boolean;
}


/**
 * Displays the standard XTEIN platform toolbar.
 *
 * The toolbar does not contain application-specific logic.
 *
 * Its responsibilities are exclusively:
 *
 * - render the ToolbarState of the active application;
 * - preserve the standard XTEIN action order;
 * - display only permitted/supported actions;
 * - reflect enabled and disabled states;
 * - dispatch actions through ToolbarRuntimeService.
 */
@Component({
  selector:
    'app-platform-toolbar',

  standalone:
    true,

  imports:
    [],

  templateUrl:
    './platform-toolbar.component.html',

  styleUrl:
    './platform-toolbar.component.scss'
})
export class PlatformToolbar {

  /**
   * Toolbar items currently visible for the active
   * workspace application.
   *
   * This value automatically changes when:
   *
   * - the active workspace tab changes;
   * - an application publishes a new ToolbarState;
   * - the application changes operation mode.
   */
  readonly items =
    computed<
      readonly RenderedPlatformToolbarItem[]
    >(
      () => {

        const toolbarState =
          this.toolbarRuntime
            .activeToolbarState();

        if (!toolbarState) {

          return [];
        }


        const renderedItems:
          RenderedPlatformToolbarItem[] =
            [];

        let previousGroup:
          PlatformToolbarGroup | undefined;


        for (
          const definition
          of PlatformToolbarItems
        ) {

          const actionState =
            toolbarState.actions[
              definition.action
            ];

          if (
            !actionState ||
            !actionState.visible
          ) {

            continue;
          }


          const separatorBefore =
            previousGroup !==
              undefined &&
            previousGroup !==
              definition.group;


          renderedItems.push({
            ...definition,

            enabled:
              actionState.enabled,

            separatorBefore
          });


          previousGroup =
            definition.group;
        }


        return renderedItems;
      }
    );


  /**
   * Indicates whether the active application currently
   * exposes at least one toolbar action.
   */
  readonly visible =
    computed(
      () =>
        this.items().length > 0
    );


  /**
   * Identifier of the application whose toolbar is
   * currently displayed.
   */
  readonly applicationId =
    computed<
      string | null
    >(
      () =>
        this.toolbarRuntime
          .activeToolbarState()
          ?.applicationId ??
        null
    );


  constructor(
    private readonly toolbarRuntime:
      ToolbarRuntimeService
  ) {
  }


  /**
   * Dispatches a toolbar action to the active application.
   *
   * ToolbarRuntimeService performs the final validation and
   * refuses to dispatch invisible or disabled actions.
   *
   * @param action Requested toolbar action.
   */
  execute(
    action:
      ToolbarAction
  ): void {

    this.toolbarRuntime
      .dispatchAction(
        action
      );
  }
}