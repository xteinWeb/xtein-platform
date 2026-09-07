import {
  Injectable
} from '@angular/core';

import {
  DashboardControl,
  DashboardPanelExtension,
  IExtension
} from 'devexpress-dashboard';


/**
 * Creates one Dashboard extension for a DashboardControl.
 */
export type XteinDashboardExtensionFactory =
  (
    dashboardControl:
      DashboardControl
  ) =>
    IExtension;


/**
 * Defines one registered XTEIN Dashboard extension.
 */
interface XteinDashboardExtensionRegistration {

  /**
   * Unique registration identifier.
   */
  key:
    string;


  /**
   * Extension factory.
   */
  factory:
    XteinDashboardExtensionFactory;
}


/**
 * Central registry of extensions used by every XTEIN Dashboard.
 *
 * Functional applications must not register DevExpress extensions
 * independently.
 *
 * Legacy Dashboard customizations are migrated into this runtime
 * layer and are then automatically available to every
 * XteinDashboardComponent.
 */
@Injectable({
  providedIn:
    'root'
})
export class XteinDashboardExtensionRegistryService {

  /**
   * Extensions registered programmatically by the platform.
   */
  private readonly registrations =
    new Map<
      string,
      XteinDashboardExtensionRegistration
    >();


  constructor() {

    this.registerBuiltInExtensions();
  }


  /**
   * Registers one extension factory.
   *
   * Re-registering the same key replaces the previous factory.
   *
   * @param key Unique registration key.
   * @param factory Extension factory.
   */
  register(
    key:
      string,

    factory:
      XteinDashboardExtensionFactory
  ): void {

    const normalizedKey =
      key
        ?.trim();


    if (
      !normalizedKey
    ) {

      throw new Error(
        'XTEIN Dashboard extension key cannot be empty.'
      );
    }


    this.registrations.set(
      normalizedKey,
      {
        key:
          normalizedKey,

        factory
      }
    );
  }


  /**
   * Registers every configured extension in one DashboardControl.
   *
   * This method is called from the Dashboard BeforeRender event.
   *
   * @param dashboardControl DevExpress Dashboard control.
   */
  registerExtensions(
    dashboardControl:
      DashboardControl
  ): void {

    for (
      const registration
      of this.registrations.values()
    ) {

      const extension =
        registration.factory(
          dashboardControl
        );


      if (
        !extension
      ) {

        continue;
      }


      const existingExtension =
        dashboardControl
          .findExtension(
            extension.name
          );


      if (
        existingExtension
      ) {

        continue;
      }


      dashboardControl
        .registerExtension(
          extension
        );
    }
  }


  /**
   * Registers standard XTEIN Dashboard extensions.
   *
   * Custom legacy extensions are added to the same registry
   * as they are migrated.
   */
  private registerBuiltInExtensions():
    void {

    this.register(
      'dashboard-panel',
      dashboardControl =>
        new DashboardPanelExtension(
          dashboardControl
        )
    );
  }
}