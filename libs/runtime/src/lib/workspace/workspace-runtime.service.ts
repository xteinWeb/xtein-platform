import {
  computed,
  Injectable,
  signal
} from '@angular/core';

import {
  ApplicationRequest,
  WorkspaceTab
} from '@xtein/sdk';

import {
  ApplicationCatalogService
} from '../applications/application-catalog.service';

import {
  ToolbarRuntimeService
} from '../toolbar/services/toolbar-runtime.service';


/**
 * Maintains the runtime state of the XTEIN tab-based workspace.
 *
 * Each XTEIN application can have at most one open workspace tab.
 *
 * Opening an application that is already open activates its
 * existing tab instead of creating a second instance.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceRuntimeService {

  /**
   * Internal collection of opened workspace tabs.
   */
  private readonly tabsState =
    signal<
      readonly WorkspaceTab[]
    >(
      []
    );


  /**
   * Identifier of the currently active application.
   *
   * Because an application can only have one workspace tab,
   * applicationId is also the unique tab identifier.
   */
  private readonly activeApplicationIdState =
    signal<
      string | null
    >(
      null
    );


  /**
   * Read-only collection of opened workspace tabs.
   */
  readonly tabs =
    this.tabsState
      .asReadonly();


  /**
   * Read-only identifier of the active workspace application.
   */
  readonly activeApplicationId =
    this.activeApplicationIdState
      .asReadonly();


  /**
   * Currently active workspace tab.
   */
  readonly activeTab =
    computed<
      WorkspaceTab | null
    >(
      () => {

        const applicationId =
          this.activeApplicationIdState();

        if (!applicationId) {

          return null;
        }

        return (
          this.tabsState()
            .find(
              tab =>
                tab.applicationId ===
                applicationId
            ) ??
          null
        );
      }
    );


  /**
   * Indicates whether at least one application is open.
   */
  readonly hasOpenTabs =
    computed(
      () =>
        this.tabsState().length > 0
    );


  constructor(
    private readonly applicationCatalog:
      ApplicationCatalogService,

    private readonly toolbarRuntime:
      ToolbarRuntimeService
  ) {
  }


  /**
   * Opens an XTEIN application in the workspace.
   *
   * If the application is already open, the existing tab is
   * activated and no new application instance is created.
   *
   * @param request Application opening request.
   * @returns Opened or reactivated workspace tab.
   */
  openApplication(
    request:
      ApplicationRequest
  ): WorkspaceTab {

    const applicationId =
      this.normalizeApplicationId(
        request.applicationId
      );


    const existingTab =
      this.tabsState()
        .find(
          tab =>
            tab.applicationId ===
            applicationId
        );


    if (existingTab) {

      this.activateApplication(
        applicationId
      );

      return (
        this.getTab(
          applicationId
        ) ??
        existingTab
      );
    }


    const descriptor =
      this.applicationCatalog
        .resolveApplication(
          applicationId
        );


    const newTab:
      WorkspaceTab = {

        applicationId,

        title:
          request.title,

        icon:
          request.icon,

        remoteName:
          descriptor.remoteName,

        exposedModule:
          descriptor.exposedModule,

        remoteEntryUrl:
          descriptor.remoteEntryUrl,

        version:
          descriptor.version,

        closable:
          true,

        active:
          true,

        dirty:
          false,

        parameters:
          request.parameters
      };


    this.tabsState.update(
      tabs => [

        ...tabs.map(
          tab => ({
            ...tab,
            active:
              false
          })
        ),

        newTab
      ]
    );


    this.activeApplicationIdState.set(
      applicationId
    );


    this.toolbarRuntime
      .activateApplication(
        applicationId
      );


    return newTab;
  }


  /**
   * Activates an already opened application.
   *
   * The application component is not destroyed or recreated.
   * Only the active workspace tab changes.
   *
   * @param applicationId Application to activate.
   * @returns True when the application was found and activated.
   */
  activateApplication(
    applicationId:
      string
  ): boolean {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );

    const tabs =
      this.tabsState();

    const exists =
      tabs.some(
        tab =>
          tab.applicationId ===
          normalizedApplicationId
      );


    if (!exists) {

      return false;
    }


    this.tabsState.set(
      tabs.map(
        tab => ({
          ...tab,
          active:
            tab.applicationId ===
            normalizedApplicationId
        })
      )
    );


    this.activeApplicationIdState.set(
      normalizedApplicationId
    );


    this.toolbarRuntime
      .activateApplication(
        normalizedApplicationId
      );


    return true;
  }


  /**
   * Returns an opened workspace tab.
   *
   * @param applicationId Application identifier.
   * @returns Workspace tab or undefined when the application is not open.
   */
  getTab(
    applicationId:
      string
  ): WorkspaceTab | undefined {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );

    return this.tabsState()
      .find(
        tab =>
          tab.applicationId ===
          normalizedApplicationId
      );
  }


  /**
   * Indicates whether an application is currently open.
   *
   * @param applicationId Application identifier.
   * @returns True when the application already has a workspace tab.
   */
  isOpen(
    applicationId:
      string
  ): boolean {

    return Boolean(
      this.getTab(
        applicationId
      )
    );
  }


  /**
   * Updates the dirty state of an opened application.
   *
   * @param applicationId Application identifier.
   * @param dirty Unsaved-change state.
   */
  setDirty(
    applicationId:
      string,

    dirty:
      boolean
  ): void {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );


    this.tabsState.update(
      tabs =>
        tabs.map(
          tab => {

            if (
              tab.applicationId !==
              normalizedApplicationId
            ) {

              return tab;
            }


            return {
              ...tab,
              dirty
            };
          }
        )
    );
  }


  /**
   * Attempts to close an opened application.
   *
   * Dirty applications are not closed unless force is true.
   *
   * @param applicationId Application identifier.
   * @param force Allows closing a dirty application.
   * @returns True when the application was closed.
   */
  closeApplication(
    applicationId:
      string,

    force =
      false
  ): boolean {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );

    const tabs =
      this.tabsState();

    const closingIndex =
      tabs.findIndex(
        tab =>
          tab.applicationId ===
          normalizedApplicationId
      );


    if (
      closingIndex < 0
    ) {

      return false;
    }


    const closingTab =
      tabs[
        closingIndex
      ];


    if (
      closingTab.dirty &&
      !force
    ) {

      return false;
    }


    const wasActive =
      closingTab.active;


    const remainingTabs =
      tabs.filter(
        tab =>
          tab.applicationId !==
          normalizedApplicationId
      );


    if (!wasActive) {

      this.tabsState.set(
        remainingTabs
      );

      this.toolbarRuntime
        .removeApplication(
          normalizedApplicationId
        );

      return true;
    }


    if (
      remainingTabs.length ===
      0
    ) {

      this.tabsState.set(
        []
      );

      this.activeApplicationIdState.set(
        null
      );

      this.toolbarRuntime
        .removeApplication(
          normalizedApplicationId
        );

      return true;
    }


    const nextActiveIndex =
      Math.min(
        closingIndex,
        remainingTabs.length - 1
      );

    const nextActiveApplicationId =
      remainingTabs[
        nextActiveIndex
      ].applicationId;


    this.tabsState.set(
      remainingTabs.map(
        tab => ({
          ...tab,
          active:
            tab.applicationId ===
            nextActiveApplicationId
        })
      )
    );


    this.activeApplicationIdState.set(
      nextActiveApplicationId
    );


    this.toolbarRuntime
      .removeApplication(
        normalizedApplicationId
      );


    this.toolbarRuntime
      .activateApplication(
        nextActiveApplicationId
      );


    return true;
  }


  /**
   * Clears the complete workspace.
   *
   * Intended for logout or full workspace reset.
   */
  clear(): void {

    this.tabsState.set(
      []
    );

    this.activeApplicationIdState.set(
      null
    );

    this.toolbarRuntime
      .clear();
  }


  /**
   * Normalizes an XTEIN application identifier.
   *
   * @param applicationId Application identifier.
   * @returns Normalized application identifier.
   */
  private normalizeApplicationId(
    applicationId:
      string
  ): string {

    const normalizedApplicationId =
      applicationId
        ?.trim()
        .toUpperCase();


    if (!normalizedApplicationId) {

      throw new Error(
        'The XTEIN application identifier cannot be empty.'
      );
    }


    return normalizedApplicationId;
  }
}