import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  signal
} from '@angular/core';

import {
  RecordToolbarMode,
  ToolbarAction
} from '@xtein/sdk';

import {
  ToolbarRuntimeService
} from '@xtein/runtime';

import {
  PlatformToolbarGroup,
  PlatformToolbarItem,
  PlatformToolbarItems,
  PlatformToolbarResponsivePriority
} from './platform-toolbar.constants';


interface RenderedPlatformToolbarItem
  extends PlatformToolbarItem {

  enabled:
    boolean;

  separatorBefore:
    boolean;
}


interface PlatformToolbarModeIndicator {

  label:
    string;

  iconClass:
    string;
}


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
    './platform-toolbar.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class PlatformToolbar
  implements AfterViewInit, OnDestroy {

  @ViewChild(
    'toolbarContainer'
  )
  private toolbarContainer?:
    ElementRef<HTMLElement>;


  private readonly toolbarWidth =
    signal(
      0
    );


  readonly overflowMenuOpen =
    signal(
      false
    );


  private resizeObserver?:
    ResizeObserver;


  private readonly availableItems =
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

          renderedItems.push({

            ...definition,

            enabled:
              actionState.enabled,

            separatorBefore:
              false
          });
        }

        return renderedItems;
      }
    );


  private readonly visiblePriority =
    computed(
      () => {

        const width =
          this.toolbarWidth();

        const mode =
          this.toolbarRuntime
            .activeToolbarState()
            ?.record
            ?.mode;

        if (
          mode === RecordToolbarMode.Creating ||
          mode === RecordToolbarMode.Editing ||
          mode === RecordToolbarMode.Copying
        ) {

          return PlatformToolbarResponsivePriority.Extended;
        }

        if (width <= 0) {

          return PlatformToolbarResponsivePriority.Extended;
        }

        if (width >= 900) {

          return PlatformToolbarResponsivePriority.Extended;
        }

        if (width >= 620) {

          return PlatformToolbarResponsivePriority.Standard;
        }

        return PlatformToolbarResponsivePriority.Essential;
      }
    );


  readonly mainItems =
    computed<
      readonly RenderedPlatformToolbarItem[]
    >(
      () =>
        this.withSeparators(
          this.availableItems()
            .filter(
              item =>
                item.responsivePriority <=
                this.visiblePriority()
            )
        )
    );


  readonly overflowItems =
    computed<
      readonly RenderedPlatformToolbarItem[]
    >(
      () =>
        this.withSeparators(
          this.availableItems()
            .filter(
              item =>
                item.responsivePriority >
                this.visiblePriority()
            )
        )
    );


  readonly visible =
    computed(
      () =>
        this.availableItems().length > 0 ||
        this.modeIndicator() !== null
    );


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


  readonly modeIndicator =
    computed<
      PlatformToolbarModeIndicator | null
    >(
      () => {

        const mode =
          this.toolbarRuntime
            .activeToolbarState()
            ?.record
            ?.mode;

        switch (mode) {

          case RecordToolbarMode.Creating:

            return {
              label:
                'Nuevo registro [EDICIÓN]',

              iconClass:
                'icon-crear-sl'
            };

          case RecordToolbarMode.Editing:

            return {
              label:
                'Modificar registro [EDICIÓN]',

              iconClass:
                'icon-editar-sl'
            };

          case RecordToolbarMode.Copying:

            return {
              label:
                'Copiar registro [EDICIÓN]',

              iconClass:
                'icon-copiar'
            };

          default:

            return null;
        }
      }
    );


  readonly recordPositionVisible =
    computed(
      () => {

        const recordState =
          this.toolbarRuntime
            .activeToolbarState()
            ?.record;

        return Boolean(
          recordState &&
          recordState.totalRecords > 0 &&
          this.mainItems()
            .some(
              item =>
                item.action ===
                ToolbarAction.Previous
            )
        );
      }
    );


  readonly currentRecord =
    computed(
      () => {

        const recordState =
          this.toolbarRuntime
            .activeToolbarState()
            ?.record;

        if (
          !recordState ||
          recordState.totalRecords <= 0
        ) {

          return 0;
        }

        return recordState.currentIndex + 1;
      }
    );


  readonly totalRecords =
    computed(
      () =>
        this.toolbarRuntime
          .activeToolbarState()
          ?.record
          ?.totalRecords ??
        0
    );


  readonly previousAction =
    ToolbarAction.Previous;


  constructor(
    private readonly toolbarRuntime:
      ToolbarRuntimeService
  ) {
  }


  ngAfterViewInit():
    void {

    const element =
      this.toolbarContainer
        ?.nativeElement;

    if (!element) {

      return;
    }

    this.toolbarWidth.set(
      Math.round(
        element.getBoundingClientRect().width
      )
    );

    if (
      typeof ResizeObserver ===
        'undefined'
    ) {

      return;
    }

    this.resizeObserver =
      new ResizeObserver(
        entries => {

          const entry =
            entries[0];

          if (!entry) {

            return;
          }

          this.toolbarWidth.set(
            Math.round(
              entry.contentRect.width
            )
          );
        }
      );

    this.resizeObserver.observe(
      element
    );
  }


  ngOnDestroy():
    void {

    this.resizeObserver
      ?.disconnect();
  }


  @HostListener(
    'document:click'
  )
  closeOverflowMenu():
    void {

    if (
      this.overflowMenuOpen()
    ) {

      this.overflowMenuOpen.set(
        false
      );
    }
  }


  execute(
    action:
      ToolbarAction
  ): void {

    this.overflowMenuOpen.set(
      false
    );

    this.toolbarRuntime
      .dispatchAction(
        action
      );
  }


  toggleOverflowMenu(
    event:
      MouseEvent
  ): void {

    event.stopPropagation();

    this.overflowMenuOpen.update(
      current =>
        !current
    );
  }


  keepOverflowMenuOpen(
    event:
      MouseEvent
  ): void {

    event.stopPropagation();
  }


  private withSeparators(
    items:
      readonly RenderedPlatformToolbarItem[]
  ): readonly RenderedPlatformToolbarItem[] {

    const result:
      RenderedPlatformToolbarItem[] =
        [];

    let previousGroup:
      PlatformToolbarGroup | undefined;

    for (
      const item
      of items
    ) {

      result.push({

        ...item,

        separatorBefore:
          previousGroup !==
            undefined &&
          previousGroup !==
            item.group
      });

      previousGroup =
        item.group;
    }

    return result;
  }
}