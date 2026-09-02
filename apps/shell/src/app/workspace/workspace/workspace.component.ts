import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  OnDestroy,
  signal,
  ViewChild
} from '@angular/core';

import {
  WorkspaceTab
} from '@xtein/sdk';

import {
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  WorkspaceTabHostComponent
} from '../workspace-tab-host/workspace-tab-host.component';


/**
 * Provides the tab-based XTEIN application workspace.
 *
 * The workspace tab bar remains permanently visible.
 *
 * Newly opened applications are displayed at the beginning
 * of the visual tab strip.
 *
 * Inactive application hosts remain instantiated while the user
 * changes tabs so their complete functional state is preserved.
 */
@Component({
  selector:
    'app-workspace',

  standalone:
    true,

  imports: [
    WorkspaceTabHostComponent
  ],

  templateUrl:
    './workspace.component.html',

  styleUrl:
    './workspace.component.scss'
})
export class Workspace
  implements
    AfterViewInit,
    OnDestroy {

  /**
   * Same default application icon used by Sidebar.
   */
  private readonly defaultApplicationIcon =
    'xt-icon-application';


  /**
   * Duration of the active-tab capsule movement.
   *
   * A slightly longer duration makes the displacement
   * clearly perceptible without making the UI feel slow.
   */
  private readonly tabAnimationDuration =
    420;


  /**
   * Scrollable viewport containing workspace tabs.
   */
  @ViewChild(
    'tabViewport',
    {
      read:
        ElementRef
    }
  )
  private tabViewport?:
    ElementRef<HTMLDivElement>;


  /**
   * Single visual capsule representing the active tab.
   */
  @ViewChild(
    'activeIndicator',
    {
      read:
        ElementRef
    }
  )
  private activeIndicator?:
    ElementRef<HTMLDivElement>;


  /**
   * Indicates whether the opened-applications menu is visible.
   */
  tabMenuOpen =
    false;


  /**
   * Runtime workspace tabs.
   *
   * Their functional order remains owned by WorkspaceRuntimeService.
   */
  readonly tabs =
    this.workspaceRuntime
      .tabs;


  /**
   * Visual tab order.
   *
   * The newest application is displayed first without modifying
   * the functional order maintained by the platform runtime.
   */
  readonly displayTabs =
    computed(
      () =>
        [
          ...this.tabs()
        ].reverse()
    );


  /**
   * Active application identifier.
   */
  readonly activeApplicationId =
    this.workspaceRuntime
      .activeApplicationId;


  /**
   * Indicates whether at least one application is open.
   */
  readonly hasOpenTabs =
    this.workspaceRuntime
      .hasOpenTabs;


  /**
   * Indicates whether navigation buttons are required because
   * the opened tabs exceed the available horizontal space.
   */
  readonly tabsOverflow =
    signal(
      false
    );


  /**
   * Indicates whether the user can move toward the beginning
   * of the tab collection.
   */
  readonly canScrollBackward =
    signal(
      false
    );


  /**
   * Indicates whether the user can move toward the end
   * of the tab collection.
   */
  readonly canScrollForward =
    signal(
      false
    );


  /**
   * Indicates whether Angular initialized the component view.
   */
  private viewInitialized =
    false;


  /**
   * Last logical destination of the active indicator.
   */
  private indicatorLeft:
    number | null =
      null;


  /**
   * Last logical width of the active indicator.
   */
  private indicatorWidth:
    number | null =
      null;


  /**
   * Browser frame used for layout synchronization.
   */
  private layoutAnimationFrame:
    number | null =
      null;


  /**
   * Browser frame used to start an indicator movement after
   * the previous physical position has been painted.
   */
  private indicatorMovementFrame:
    number | null =
      null;


  /**
   * Resize observer used to detect tab overflow.
   */
  private resizeObserver:
    ResizeObserver | null =
      null;


  /**
   * Application identifiers known during the previous update.
   */
  private knownApplicationIds =
    new Set<string>();


  /**
   * Indicates that the next layout synchronization must move
   * the viewport to the first visual tab.
   */
  private pendingScrollToStart =
    false;


  constructor(
    private readonly workspaceRuntime:
      WorkspaceRuntimeService
  ) {

    /**
     * Synchronizes workspace visuals whenever applications
     * are opened, closed, or activated.
     */
    effect(
      () => {

        const currentTabs =
          this.tabs();


        const activeApplicationId =
          this.activeApplicationId();


        const currentApplicationIds =
          currentTabs
            .map(
              tab =>
                tab.applicationId
            );


        const hasNewApplication =
          currentApplicationIds
            .some(
              applicationId =>
                !this.knownApplicationIds
                  .has(
                    applicationId
                  )
            );


        this.knownApplicationIds =
          new Set(
            currentApplicationIds
          );


        /*
         * Keeps the active application as an explicit
         * reactive dependency of this effect.
         */
        void activeApplicationId;


        if (
          this.viewInitialized
        ) {

          this.scheduleLayoutRefresh(
            hasNewApplication
          );
        }
      }
    );
  }


  /**
   * Initializes DOM-dependent workspace behavior.
   */
  ngAfterViewInit():
    void {

    this.viewInitialized =
      true;


    const viewport =
      this.tabViewport
        ?.nativeElement;


    if (
      viewport &&
      typeof ResizeObserver !==
        'undefined'
    ) {

      this.resizeObserver =
        new ResizeObserver(
          () => {

            this.scheduleLayoutRefresh(
              false
            );
          }
        );


      this.resizeObserver
        .observe(
          viewport
        );
    }


    this.scheduleLayoutRefresh(
      false
    );
  }


  /**
   * Releases browser resources created by the workspace.
   */
  ngOnDestroy():
    void {

    this.resizeObserver
      ?.disconnect();


    if (
      this.layoutAnimationFrame !==
        null
    ) {

      cancelAnimationFrame(
        this.layoutAnimationFrame
      );
    }


    if (
      this.indicatorMovementFrame !==
        null
    ) {

      cancelAnimationFrame(
        this.indicatorMovementFrame
      );
    }
  }


  /**
   * Closes the opened-applications menu when clicking outside.
   */
  @HostListener(
    'document:click'
  )
  onDocumentClick():
    void {

    if (
      this.tabMenuOpen
    ) {

      this.tabMenuOpen =
        false;
    }
  }


  /**
   * Recalculates tab overflow after a browser resize.
   */
  @HostListener(
    'window:resize'
  )
  onWindowResize():
    void {

    this.scheduleLayoutRefresh(
      false
    );
  }


  /**
   * Opens or closes the list of currently opened applications.
   *
   * @param event Mouse event.
   */
  toggleTabMenu(
    event:
      MouseEvent
  ): void {

    event.stopPropagation();


    if (
      !this.hasOpenTabs()
    ) {

      this.tabMenuOpen =
        false;

      return;
    }


    this.tabMenuOpen =
      !this.tabMenuOpen;
  }


  /**
   * Prevents clicks inside the application list from reaching
   * the document click listener.
   *
   * @param event Mouse event.
   */
  keepTabMenuOpen(
    event:
      MouseEvent
  ): void {

    event.stopPropagation();
  }


  /**
   * Activates an already opened workspace application.
   *
   * @param tab Workspace tab.
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
   * Activates an application selected from the opened-applications
   * menu.
   *
   * @param tab Workspace tab.
   */
  activateTabFromMenu(
    tab:
      WorkspaceTab
  ): void {

    this.workspaceRuntime
      .activateApplication(
        tab.applicationId
      );


    this.tabMenuOpen =
      false;
  }


  /**
   * Attempts to close a workspace application.
   *
   * @param event Mouse event.
   * @param tab Workspace tab.
   */
  closeTab(
    event:
      MouseEvent,

    tab:
      WorkspaceTab
  ): void {

    event.stopPropagation();


    if (
      !tab.closable
    ) {

      return;
    }


    this.workspaceRuntime
      .closeApplication(
        tab.applicationId
      );


    if (
      !this.hasOpenTabs()
    ) {

      this.tabMenuOpen =
        false;
    }
  }


  /**
   * Moves the visible tab viewport backward or forward.
   *
   * @param direction Negative moves toward the beginning.
   * Positive moves toward the end.
   */
  scrollTabs(
    direction:
      -1 | 1
  ): void {

    const viewport =
      this.tabViewport
        ?.nativeElement;


    if (!viewport) {

      return;
    }


    const distance =
      Math.max(
        Math.round(
          viewport.clientWidth *
          0.72
        ),
        220
      );


    viewport.scrollBy({
      left:
        direction *
        distance,

      behavior:
        'smooth'
    });
  }


  /**
   * Updates navigation-arrow availability while the
   * tab viewport moves.
   */
  onTabViewportScroll():
    void {

    this.updateOverflowState();
  }


  /**
   * Returns the icon associated with a workspace application.
   *
   * The configured database icon has priority. When none exists,
   * the same default icon used by Sidebar is returned.
   *
   * @param tab Workspace tab.
   */
  resolveTabIconClass(
    tab:
      WorkspaceTab
  ): string {

    const configuredIcon =
      tab.icon
        ?.trim();


    return (
      configuredIcon ||
      this.defaultApplicationIcon
    );
  }


  /**
   * Schedules DOM measurements after Angular completes
   * the current rendering operation.
   *
   * @param scrollToStart Indicates that a new application opened.
   */
  private scheduleLayoutRefresh(
    scrollToStart:
      boolean
  ): void {

    this.pendingScrollToStart =
      this.pendingScrollToStart ||
      scrollToStart;


    if (
      this.layoutAnimationFrame !==
        null
    ) {

      cancelAnimationFrame(
        this.layoutAnimationFrame
      );
    }


    this.layoutAnimationFrame =
      requestAnimationFrame(
        () => {

          this.layoutAnimationFrame =
            null;


          const shouldScrollToStart =
            this.pendingScrollToStart;


          this.pendingScrollToStart =
            false;


          const viewport =
            this.tabViewport
              ?.nativeElement;


          if (
            viewport &&
            shouldScrollToStart
          ) {

            viewport.scrollTo({
              left:
                0,

              behavior:
                'auto'
            });
          }


          this.updateOverflowState();


          const activeApplicationId =
            this.activeApplicationId();


          if (!activeApplicationId) {

            this.hideActiveIndicator();

            return;
          }


          if (
            !shouldScrollToStart
          ) {

            this.ensureTabVisible(
              activeApplicationId
            );
          }


          /*
           * Opening a new tab positions the capsule directly
           * because the whole visual order has changed.
           *
           * Switching between existing tabs performs the
           * visible sliding animation.
           */
          this.moveActiveIndicator(
            activeApplicationId,
            !shouldScrollToStart
          );
        }
      );
  }


  /**
   * Updates tab-overflow and navigation-arrow states.
   */
  private updateOverflowState():
    void {

    const viewport =
      this.tabViewport
        ?.nativeElement;


    if (!viewport) {

      this.tabsOverflow.set(
        false
      );


      this.canScrollBackward.set(
        false
      );


      this.canScrollForward.set(
        false
      );


      return;
    }


    const maximumScroll =
      Math.max(
        viewport.scrollWidth -
        viewport.clientWidth,
        0
      );


    const overflow =
      maximumScroll >
      2;


    this.tabsOverflow.set(
      overflow
    );


    this.canScrollBackward.set(
      overflow &&
      viewport.scrollLeft >
        2
    );


    this.canScrollForward.set(
      overflow &&
      viewport.scrollLeft <
        maximumScroll - 2
    );
  }


  /**
   * Ensures that the selected application tab is visible.
   *
   * @param applicationId Application identifier.
   */
  private ensureTabVisible(
    applicationId:
      string
  ): void {

    const viewport =
      this.tabViewport
        ?.nativeElement;


    const tabElement =
      this.findTabElement(
        applicationId
      );


    if (
      !viewport ||
      !tabElement
    ) {

      return;
    }


    const viewportRectangle =
      viewport
        .getBoundingClientRect();


    const tabRectangle =
      tabElement
        .getBoundingClientRect();


    const margin =
      10;


    if (
      tabRectangle.left <
      viewportRectangle.left
    ) {

      viewport.scrollBy({
        left:
          tabRectangle.left -
          viewportRectangle.left -
          margin,

        behavior:
          'smooth'
      });

      return;
    }


    if (
      tabRectangle.right >
      viewportRectangle.right
    ) {

      viewport.scrollBy({
        left:
          tabRectangle.right -
          viewportRectangle.right +
          margin,

        behavior:
          'smooth'
      });
    }
  }


  /**
   * Moves the single active-tab capsule.
   *
   * The previous rendered capsule position is preserved,
   * forced into the browser layout, and then the new position
   * is applied on the next animation frame.
   *
   * This guarantees that the browser has two distinct visual
   * states to interpolate between.
   *
   * @param applicationId Application identifier.
   * @param animate Indicates whether movement should be animated.
   */
  private moveActiveIndicator(
    applicationId:
      string,

    animate:
      boolean
  ): void {

    const indicator =
      this.activeIndicator
        ?.nativeElement;


    const target =
      this.findTabElement(
        applicationId
      );


    if (
      !indicator ||
      !target
    ) {

      this.hideActiveIndicator();

      return;
    }


    const targetLeft =
      target.offsetLeft;


    const targetWidth =
      target.offsetWidth;


    /*
     * Initial indicator position.
     */
    if (
      this.indicatorLeft ===
        null ||
      this.indicatorWidth ===
        null
    ) {

      indicator.style.transition =
        'none';


      indicator.style.left =
        `${targetLeft}px`;


      indicator.style.width =
        `${targetWidth}px`;


      indicator.style.opacity =
        '1';


      this.indicatorLeft =
        targetLeft;


      this.indicatorWidth =
        targetWidth;


      return;
    }


    /*
     * A duplicated Angular synchronization for the same
     * destination must not restart or cancel the movement.
     */
    if (
      this.indicatorLeft ===
        targetLeft &&
      this.indicatorWidth ===
        targetWidth
    ) {

      return;
    }


    /*
     * When animation is intentionally disabled, position
     * the capsule immediately.
     */
    if (!animate) {

      if (
        this.indicatorMovementFrame !==
          null
      ) {

        cancelAnimationFrame(
          this.indicatorMovementFrame
        );


        this.indicatorMovementFrame =
          null;
      }


      indicator.style.transition =
        'none';


      indicator.style.left =
        `${targetLeft}px`;


      indicator.style.width =
        `${targetWidth}px`;


      indicator.style.opacity =
        '1';


      this.indicatorLeft =
        targetLeft;


      this.indicatorWidth =
        targetWidth;


      return;
    }


    /*
     * Read the actual rendered capsule position.
     *
     * This allows rapid tab switching to start from the
     * position where the previous animation currently is.
     */
    const indicatorRectangle =
      indicator
        .getBoundingClientRect();


    const trackRectangle =
      indicator
        .parentElement
        ?.getBoundingClientRect();


    let currentLeft =
      this.indicatorLeft;


    let currentWidth =
      this.indicatorWidth;


    if (trackRectangle) {

      currentLeft =
        indicatorRectangle.left -
        trackRectangle.left;


      currentWidth =
        indicatorRectangle.width;
    }


    if (
      this.indicatorMovementFrame !==
        null
    ) {

      cancelAnimationFrame(
        this.indicatorMovementFrame
      );


      this.indicatorMovementFrame =
        null;
    }


    /*
     * Step 1:
     * Place the indicator explicitly at the currently rendered
     * location with transitions disabled.
     */
    indicator.style.transition =
      'none';


    indicator.style.left =
      `${currentLeft}px`;


    indicator.style.width =
      `${currentWidth}px`;


    indicator.style.opacity =
      '1';


    /*
     * Force the browser to commit the starting state.
     */
    void indicator.offsetWidth;


    /*
     * Step 2:
     * Enable the transition.
     */
    indicator.style.transition =
      [
        `left ${this.tabAnimationDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        `width ${this.tabAnimationDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
      ]
        .join(
          ', '
        );


    /*
     * Step 3:
     * Apply the destination on a new painted frame.
     */
    this.indicatorMovementFrame =
      requestAnimationFrame(
        () => {

          this.indicatorMovementFrame =
            null;


          indicator.style.left =
            `${targetLeft}px`;


          indicator.style.width =
            `${targetWidth}px`;
        }
      );


    /*
     * Save the logical destination immediately.
     *
     * Duplicate layout refreshes will therefore be ignored
     * instead of interrupting the current transition.
     */
    this.indicatorLeft =
      targetLeft;


    this.indicatorWidth =
      targetWidth;
  }


  /**
   * Hides and resets the active-tab capsule.
   */
  private hideActiveIndicator():
    void {

    const indicator =
      this.activeIndicator
        ?.nativeElement;


    if (
      this.indicatorMovementFrame !==
        null
    ) {

      cancelAnimationFrame(
        this.indicatorMovementFrame
      );


      this.indicatorMovementFrame =
        null;
    }


    this.indicatorLeft =
      null;


    this.indicatorWidth =
      null;


    if (indicator) {

      indicator.style.transition =
        'none';


      indicator.style.opacity =
        '0';


      indicator.style.width =
        '0';
    }
  }


  /**
   * Finds the physical tab button associated with an application.
   *
   * @param applicationId Application identifier.
   */
  private findTabElement(
    applicationId:
      string
  ): HTMLButtonElement | null {

    const viewport =
      this.tabViewport
        ?.nativeElement;


    if (!viewport) {

      return null;
    }


    const tabElements =
      viewport.querySelectorAll<HTMLButtonElement>(
        '.xt-workspace-tab[data-application-id]'
      );


    for (
      const tabElement of
      Array.from(
        tabElements
      )
    ) {

      if (
        tabElement.dataset[
          'applicationId'
        ] ===
        applicationId
      ) {

        return tabElement;
      }
    }


    return null;
  }
}