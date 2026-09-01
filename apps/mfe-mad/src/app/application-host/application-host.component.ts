import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import {
  findMadApplication
} from '../applications/mad-application.registry';


/**
 * Entry point exposed by the MAD microfrontend.
 *
 * The XTEIN Shell loads this component through Native Federation
 * and provides the identifier of the application that must be
 * rendered inside the MAD microfrontend.
 *
 * Application resolution is delegated to the MAD application
 * registry so this component remains independent from individual
 * application implementations.
 */
@Component({
  selector:
    'mad-application-host',

  standalone:
    true,

  imports:
    [],

  templateUrl:
    './application-host.component.html',

  styleUrl:
    './application-host.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ApplicationHostComponent
  implements
    AfterViewInit,
    OnChanges {

  /**
   * XTEIN application identifier requested by the Shell.
   *
   * Example:
   * MAD-005
   */
  @Input()
  applicationId =
    '';


  /**
   * Angular container where the resolved application
   * component is created.
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
   * Indicates that the requested MAD application is loading.
   */
  readonly loading =
    signal(
      false
    );


  /**
   * Application resolution error displayed inside the
   * microfrontend.
   */
  readonly errorMessage =
    signal<
      string | null
    >(
      null
    );


  /**
   * Indicates whether the Angular view container
   * has already been initialized.
   */
  private viewInitialized =
    false;


  /**
   * Identifier of the application currently loaded
   * inside this host.
   */
  private loadedApplicationId:
    string | null =
      null;


  /**
   * Dynamically created application component.
   */
  private applicationComponentRef:
    ComponentRef<unknown> | null =
      null;


  /**
   * Starts application resolution after the dynamic
   * component container becomes available.
   */
  ngAfterViewInit():
    void {

    this.viewInitialized =
      true;

    void this.loadRequestedApplication();
  }


  /**
   * Reacts when the Shell supplies or changes the
   * requested application identifier.
   *
   * @param changes Angular input changes.
   */
  ngOnChanges(
    changes:
      SimpleChanges
  ): void {

    if (
      !changes[
        'applicationId'
      ]
    ) {

      return;
    }


    if (
      !this.viewInitialized
    ) {

      return;
    }


    void this.loadRequestedApplication();
  }


  /**
   * Resolves and instantiates the requested MAD application.
   */
  private async loadRequestedApplication():
    Promise<void> {

    const normalizedApplicationId =
      this.applicationId
        ?.trim()
        .toUpperCase();


    if (!normalizedApplicationId) {

      return;
    }


    if (
      normalizedApplicationId ===
        this.loadedApplicationId
    ) {

      return;
    }


    this.loading.set(
      true
    );

    this.errorMessage.set(
      null
    );


    try {

      const registration =
        findMadApplication(
          normalizedApplicationId
        );


      if (!registration) {

        throw new Error(
          `The application '${normalizedApplicationId}' is not registered in the MAD microfrontend.`
        );
      }


      const applicationComponent =
        await registration
          .load();


      this.applicationComponentRef
        ?.destroy();


      this.applicationContainer
        .clear();


      this.applicationComponentRef =
        this.applicationContainer
          .createComponent(
            applicationComponent
          );


      this.loadedApplicationId =
        normalizedApplicationId;


      this.applicationComponentRef
        .changeDetectorRef
        .detectChanges();


      this.loading.set(
        false
      );

    } catch (error) {

      this.applicationComponentRef
        ?.destroy();

      this.applicationComponentRef =
        null;

      this.applicationContainer
        .clear();

      this.loadedApplicationId =
        null;

      this.loading.set(
        false
      );

      this.errorMessage.set(
        `No fue posible cargar la aplicación ${normalizedApplicationId}.`
      );


      console.error(
        'XTEIN MAD application resolution failed.',
        {
          applicationId:
            normalizedApplicationId,

          error
        }
      );
    }
  }
}