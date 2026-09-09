import {
  Injectable
} from '@angular/core';

import {
  DashboardControl,
  IExtension
} from 'devexpress-dashboard';
import { ChartScaleBreaksExtension } from '../extensions/chart-scale-breaks-extension';
import { ChartAxisMaxValueExtension } from '../extensions/chart-axis-max-value-extension';
import { ChartLineOptionsExtension } from '../extensions/chart-line-options-extension';
import { GridHeaderFilterExtension } from '../extensions/grid-header-filter-extension';
import { ItemDescriptionExtension } from '../extensions/item-description-extension';
import { DashboardDescriptionExtension } from '../extensions/dashboard-description-extension';
import { ChartConstantLinesExtension } from '../extensions/chart-constant-lines-extension';
import { CardSetKpiExtension } from '../extensions/card-setkpi-extension';
import { XteinDashboardEditorRequest } from '../models/xtein-dashboard-editor.model';
import { XteinDashboardDesignerPolicyExtension } from '../extensions/xtein-dashboard-designer-policy.extension';
import { XteinDashboardIconsService } from './xtein-dashboard-icons.service';


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


  constructor(private readonly icons: XteinDashboardIconsService) {

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
      DashboardControl,
    edit: (request: XteinDashboardEditorRequest) => void = () => {}
  ): void {
    this.icons.register(dashboardControl);

    for (const extension of [new ChartConstantLinesExtension(dashboardControl, edit), new CardSetKpiExtension(dashboardControl, edit)]) {
      if (!dashboardControl.findExtension(extension.name)) dashboardControl.registerExtension(extension);
    }

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

    this.register('scale-breaks', control => new ChartScaleBreaksExtension(control));
    this.register('axis-max', control => new ChartAxisMaxValueExtension(control));
    this.register('line-options', control => new ChartLineOptionsExtension(control));
    this.register('grid-header', control => new GridHeaderFilterExtension(control));
    this.register('item-description', control => new ItemDescriptionExtension(control));
    this.register('dashboard-description', control => new DashboardDescriptionExtension(control));

    this.register('designer-policy', control => new XteinDashboardDesignerPolicyExtension(control));
  }
}
