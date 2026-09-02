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
 * Defines the contract exposed by every XTEIN
 * Angular microfrontend.
 */
interface RemoteApplicationHostModule {

  /**
   * Standard component exposed by the microfrontend.
   */
  ApplicationHostComponent:
    Type<unknown>;
}


/**
 * Standard input names supported by the remote
 * application host.
 */
const RemoteApplicationHostInput = {

  ApplicationId:
    'applicationId'

} as const;


/**
 * Persistent host for one application opened inside
 * the XTEIN workspace.
 *
 * The host remains instantiated when another tab becomes
 * active so the complete application state is preserved.
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
export class WorkspaceTabHostComponent
  implements AfterViewInit {

  /**
   * Workspace tab represented by this host.
   */
  @Input({
    required:
      true
  })
  tab!:
    WorkspaceTab;


  /**
   * Container where the remote ApplicationHostComponent
   * will be dynamically instantiated.
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
   * Indicates whether the remote application is loading.
   */
  readonly loading =
    signal(
      true
    );


  /**
   * Loading error displayed inside the workspace.
   */
  readonly errorMessage =
    signal<
      string | null
    >(
      null
    );


  /**
   * Reference to the dynamically instantiated
   * remote application.
   */
  private applicationComponentRef:
    ComponentRef<unknown> | null =
      null;


  /**
   * Prevents loading the same remote application
   * more than once for this workspace tab.
   */
  private applicationLoaded =
    false;


  /**
   * Loads the remote application after the dynamic
   * component container becomes available.
   */
  ngAfterViewInit():
    void {

    void this.loadApplication();
  }


  /**
   * Loads the microfrontend associated with the workspace tab.
   *
   * Remote configuration comes entirely from the XTEIN
   * application catalog.
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
   * Validates the federation information supplied
   * by the application catalog.
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