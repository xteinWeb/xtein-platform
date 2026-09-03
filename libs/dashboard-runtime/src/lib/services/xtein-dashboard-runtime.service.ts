import {
  Injectable,
  signal
} from '@angular/core';

import {
  XteinDashboardRuntimeConfig
} from '../models/xtein-dashboard-runtime-config.model';


/**
 * Maintains the global XTEIN Dashboard runtime configuration.
 *
 * The Shell initializes this service using its environment.
 *
 * Functional microfrontends do not know Dashboard backend URLs
 * and do not import Shell environment files directly.
 */
@Injectable({
  providedIn:
    'root'
})
export class XteinDashboardRuntimeService {

  /**
   * Internal Dashboard runtime configuration.
   */
  private readonly configurationState =
    signal<
      XteinDashboardRuntimeConfig | null
    >(
      null
    );


  /**
   * Read-only Dashboard runtime configuration.
   */
  readonly configuration =
    this.configurationState
      .asReadonly();


  /**
   * Configures the shared Dashboard runtime.
   *
   * The Dashboard endpoint is intentionally preserved as a
   * relative URL when configured that way by the Shell.
   *
   * This allows the existing development and production proxy
   * infrastructure to route Dashboard requests.
   *
   * @param configuration Dashboard runtime configuration.
   */
  configure(
    configuration:
      XteinDashboardRuntimeConfig
  ): void {

    const designerEndpoint =
      configuration
        .designerEndpoint
        ?.trim();


    if (
      !designerEndpoint
    ) {

      throw new Error(
        'XTEIN Dashboard Designer endpoint cannot be empty.'
      );
    }


    this.configurationState.set({

      designerEndpoint:
        this.normalizeEndpoint(
          designerEndpoint
        )
    });
  }


  /**
   * Returns the Dashboard Designer endpoint configured by
   * the XTEIN Shell.
   *
   * The value is not converted into an absolute URL.
   *
   * Example:
   * /api/dashboard-designer
   *
   * @returns Dashboard Designer endpoint.
   */
  getDesignerEndpoint():
    string {

    const configuration =
      this.configurationState();


    if (
      !configuration
    ) {

      throw new Error(
        'XTEIN Dashboard runtime has not been configured by the Shell.'
      );
    }


    return configuration
      .designerEndpoint;
  }


  /**
   * Indicates whether the Dashboard runtime has already
   * been configured by the Shell.
   *
   * @returns True when configured.
   */
  isConfigured():
    boolean {

    return (
      this.configurationState() !==
      null
    );
  }


  /**
   * Normalizes the Dashboard endpoint without converting
   * relative URLs into absolute URLs.
   *
   * Absolute URLs are preserved unchanged.
   *
   * Relative endpoint values receive a leading slash when
   * necessary.
   *
   * @param endpoint Dashboard endpoint.
   * @returns Normalized endpoint.
   */
  private normalizeEndpoint(
    endpoint:
      string
  ): string {

    const normalizedEndpoint =
      endpoint.trim();


    if (
      /^https?:\/\//i.test(
        normalizedEndpoint
      )
    ) {

      return normalizedEndpoint;
    }


    return normalizedEndpoint
      .startsWith(
        '/'
      )
        ? normalizedEndpoint
        : `/${normalizedEndpoint}`;
  }
}