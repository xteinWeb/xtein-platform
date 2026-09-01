import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Input,
  signal,
  Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import {
  loadRemoteModule
} from '@angular-architects/native-federation';

import {
  WorkspaceTab
} from '@xtein/sdk';


/**
 * Defines the standard module contract exposed by every
 * XTEIN Angular microfrontend.
 *
 * Every remote application container must expose a standalone
 * Angular component named ApplicationHostComponent.
 */
interface RemoteApplicationHostModule {

  /**
   * Standard remote application host component.
   */
  ApplicationHostComponent:
    Type<unknown>;
}


/**
 * Defines the standard inputs supported by an XTEIN
 * remote ApplicationHostComponent.
 *
 * These values are platform contracts and must not be duplicated
 * as string literals throughout the workspace loader.
 */
const RemoteApplicationHostInput = {

  /**
   * XTEIN application identifier requested by the Shell.
   */
  ApplicationId:
    'applicationId'

} as const;


/**
 * Provides the persistent content host of one XTEIN workspace tab.
 *
 * One host instance exists for each opened application.
 *
 * The host remains alive while the user changes between workspace
 * tabs so the loaded microfrontend component and all of its functional
 * state remain preserved.
 */
@Component({
  selector:
    'app-workspace-tab-host',

  standalone:
    true,

  imports:
    [],

  templateUrl:
    './workspace-tab-host.component.html',

  styleUrl:
    './workspace-tab-host.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class WorkspaceTabHost
  implements AfterViewInit {

  /**
   * Workspace application represented by this host.
   */
  @Input({
    required:
      true
  })
  tab!:
    WorkspaceTab;


  /**
   * Angular container where the remote ApplicationHostComponent
   * is dynamically instantiated.
   */
  @ViewChild(
    'applicationContainer',
    {
      read:
        ViewContainerRef,

      static:
        true
    }
  )
  private applicationContainer!:
    ViewContainerRef;


  /**
   * Indicates that the remote application is currently loading.
   */
  readonly loading =
    signal(
      true
    );


  /**
   * User-facing remote loading error.
   *
   * Technical details are written to the browser console while
   * the workspace remains operational.
   */
  readonly errorMessage =
    signal<
      string | null
    >(
      null
    );


  /**
   * Dynamically created remote Angular component.
   */
  private applicationComponentRef:
    ComponentRef<unknown> | null =
      null;


  /**
   * Prevents the same workspace host from loading its
   * microfrontend more than once.
   */
  private applicationLoaded =
    false;


  /**
   * Loads the remote application after the Angular view container
   * has been initialized.
   */
  ngAfterViewInit():
    void {

    void this.loadApplication();
  }


  /**
   * Loads and instantiates the microfrontend associated with
   * the current workspace tab.
   *
   * Remote information is obtained exclusively from WorkspaceTab.
   * No microfrontend name, port, URL, or exposed module is
   * hardcoded in the Shell.
   */
  private async loadApplication():
    Promise<void> {

    if (
      this.applicationLoaded
    ) {

      return;
    }


    this.applicationLoaded =
      true;

    this.loading.set(
      true
    );

    this.errorMessage.set(
      null
    );


    try {

      this.validateTabConfiguration();


      const remoteModule =
        await loadRemoteModule<
          RemoteApplicationHostModule
        >({

          remoteEntry:
            this.tab.remoteEntryUrl,

          remoteName:
            this.tab.remoteName,

          exposedModule:
            this.tab.exposedModule
        });


      if (
        !remoteModule ||
        !remoteModule.ApplicationHostComponent
      ) {

        throw new Error(
          `The remote module '${this.tab.exposedModule}' does not export ApplicationHostComponent.`
        );
      }


      this.applicationContainer
        .clear();


      this.applicationComponentRef =
        this.applicationContainer
          .createComponent(
            remoteModule
              .ApplicationHostComponent
          );


      this.applicationComponentRef
        .setInput(
          RemoteApplicationHostInput
            .ApplicationId,

          this.tab.applicationId
        );


      this.applicationComponentRef
        .changeDetectorRef
        .detectChanges();


      this.loading.set(
        false
      );

    } catch (error) {

      this.applicationComponentRef =
        null;

      this.loading.set(
        false
      );

      this.errorMessage.set(
        `No fue posible cargar la aplicación ${this.tab.title}.`
      );


      console.error(
        'XTEIN remote application load failed.',
        {
          applicationId:
            this.tab.applicationId,

          remoteName:
            this.tab.remoteName,

          remoteEntryUrl:
            this.tab.remoteEntryUrl,

          exposedModule:
            this.tab.exposedModule,

          error
        }
      );
    }
  }


  /**
   * Validates the dynamic microfrontend information provided
   * by the XTEIN application catalog.
   *
   * @throws Error when required federation information is missing.
   */
  private validateTabConfiguration():
    void {

    if (
      !this.tab.applicationId
        ?.trim()
    ) {

      throw new Error(
        'The workspace application identifier cannot be empty.'
      );
    }


    if (
      !this.tab.remoteName
        ?.trim()
    ) {

      throw new Error(
        `The application '${this.tab.applicationId}' does not define a federation remote name.`
      );
    }


    if (
      !this.tab.remoteEntryUrl
        ?.trim()
    ) {

      throw new Error(
        `The application '${this.tab.applicationId}' does not define a federation remote entry URL.`
      );
    }


    if (
      !this.tab.exposedModule
        ?.trim()
    ) {

      throw new Error(
        `The application '${this.tab.applicationId}' does not define a federation exposed module.`
      );
    }
  }
}