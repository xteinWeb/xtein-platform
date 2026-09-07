import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  afterEveryRender,
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
  PlatformToolbarItems
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
  implements OnDestroy {

  @ViewChild(
    'toolbarContainer'
  )
  private set toolbarContainer(value: ElementRef<HTMLElement> | undefined) {
    this.resizeObserver?.disconnect();
    this.toolbarElement = value;
    this.observeToolbar();
  }

  private toolbarElement?: ElementRef<HTMLElement>;


  private readonly hiddenActions = signal<readonly ToolbarAction[]>([]);

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


  readonly mainItems =
    computed<
      readonly RenderedPlatformToolbarItem[]
    >(
      () =>
        this.withSeparators(
          this.availableItems()
            .filter(
              item =>
                !this.hiddenActions().includes(item.action)
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
                this.hiddenActions().includes(item.action)
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
    afterEveryRender(() => this.updateLayout());
  }

  readonly goToEnabled = computed(() =>
    this.toolbarRuntime.activeToolbarState()?.actions[ToolbarAction.GoTo]?.enabled === true);

  goToRecord(input: HTMLInputElement): void {
    const value = input.valueAsNumber;
    if (Number.isInteger(value) && value >= 1 && value <= this.totalRecords()) {
      this.toolbarRuntime.dispatchAction(ToolbarAction.GoTo, value);
    }
    input.value = String(this.currentRecord());
  }


  private observeToolbar(): void {
    const host = this.toolbarElement?.nativeElement.parentElement;
    if (!host || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.updateLayout());
    this.resizeObserver.observe(host);
    const measurement = host.querySelector<HTMLElement>('[data-measurement]');
    if (measurement) this.resizeObserver.observe(measurement);
  }

  private updateLayout(): void {
    const nav = this.toolbarElement?.nativeElement;
    const host = nav?.parentElement;
    const measurement = host?.querySelector<HTMLElement>('[data-measurement]');
    if (!nav || !host || !measurement) return;
    const outerWidth = (selector: string): number => {
      const element = measurement.querySelector<HTMLElement>(selector)!;
      const style = getComputedStyle(element);
      return element.getBoundingClientRect().width +
        parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    };
    const style = getComputedStyle(nav);
    const gap = parseFloat(getComputedStyle(measurement).columnGap) || 0;
    const chrome = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    const button = outerWidth('.xt-platform-toolbar__button');
    const separator = outerWidth('.xt-platform-toolbar__separator');
    const position = outerWidth('.xt-platform-toolbar__position');
    const mode = this.modeIndicator() !== null;
    const available = host.clientWidth;
    if (available <= 0) return;
    const items = this.availableItems();
    let main = [...items];
    const width = (): number => {
      const widths: number[] = mode ? [button] : [];
      for (const item of this.withSeparators(main)) {
        if (item.separatorBefore || (mode && widths.length === 1)) widths.push(separator);
        widths.push(button);
        if (item.action === ToolbarAction.Previous && this.totalRecords() > 0) widths.push(position);
      }
      if (main.length < items.length) {
        if (widths.length) widths.push(separator);
        widths.push(button);
      }
      return chrome + widths.reduce((sum, value) => sum + value, 0) +
        Math.max(0, widths.length - 1) * gap;
    };
    // Use priorities only when the controls exceed the available space.
    const removalOrder = [...items].reverse().sort((a, b) => b.responsivePriority - a.responsivePriority);
    for (const item of removalOrder) {
      if (width() <= available || items.length === 1) break;
      main = main.filter(candidate => candidate.action !== item.action);
    }
    const hidden = items.filter(item => !main.includes(item)).map(item => item.action);
    if (hidden.join('|') !== this.hiddenActions().join('|')) {
      this.hiddenActions.set(hidden);
      this.overflowMenuOpen.set(false);
    }
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
