import { Injectable } from '@angular/core';

import {
  ApplicationDescriptor,
  ApplicationError,
  ApplicationTreeNode
} from '@xtein/sdk';

import { ApplicationRegistryService } from './application-registry.service';

/**
 * Resolves XTEIN applications using the application information
 * provided by the existing backend response.
 *
 * The catalog does not infer microfrontend ownership from application
 * prefixes. Microfrontend information stored in the XTEIN database
 * is treated as the primary source of truth.
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationCatalogService {

  constructor(
    private readonly applicationRegistry: ApplicationRegistryService
  ) {
  }

  /**
   * Resolves a complete application descriptor.
   *
   * The application must:
   * - exist in the application registry;
   * - be active;
   * - be associated with a microfrontend;
   * - reference an active microfrontend.
   *
   * @param applicationId Application identifier to resolve.
   * @returns Application descriptor ready for runtime loading.
   * @throws ApplicationError when the application cannot be resolved.
   */
  resolveApplication(
    applicationId: string
  ): ApplicationDescriptor {

    const normalizedApplicationId =
      this.normalizeApplicationId(applicationId);

    const application =
      this.applicationRegistry.getApplication(
        normalizedApplicationId
      );

    if (!application) {
      throw this.createError(
        'APPLICATION_NOT_FOUND',
        normalizedApplicationId,
        `Application "${normalizedApplicationId}" was not found in the XTEIN application registry.`
      );
    }

    this.validateApplicationStatus(application);

    if (!application.remote) {
      throw this.createError(
        'APPLICATION_NOT_MIGRATED',
        normalizedApplicationId,
        `Application "${normalizedApplicationId}" has not been migrated to the microfrontend architecture.`
      );
    }

    if (!application.remote.enabled) {
      throw this.createError(
        'REMOTE_DISABLED',
        normalizedApplicationId,
        `Microfrontend "${application.remote.remoteName}" is disabled for application "${normalizedApplicationId}".`,
        application.remote.remoteName
      );
    }

    return {
      applicationId: normalizedApplicationId,
      microfrontendId:
        application.remote.microfrontendId,
      remoteName:
        application.remote.remoteName,
      exposedModule:
        application.remote.exposedModule,
      remoteEntryUrl:
        application.remote.remoteEntryUrl,
      version:
        application.remote.version,
      enabled: true
    };
  }

  /**
   * Validates whether an application is active.
   *
   * Both English and existing XTEIN Spanish status values are supported
   * during the migration period.
   *
   * @param application Application node to validate.
   * @throws ApplicationError when the application is inactive.
   */
  private validateApplicationStatus(
    application: ApplicationTreeNode
  ): void {

    const status =
      application.status.trim().toUpperCase();

    const isActive =
      status === 'ACTIVE' ||
      status === 'ACTIVO';

    if (!isActive) {
      throw this.createError(
        'APPLICATION_DISABLED',
        application.applicationId,
        `Application "${application.applicationId}" is not active.`
      );
    }
  }

  /**
   * Normalizes an application identifier.
   *
   * @param applicationId Application identifier to normalize.
   * @returns Normalized application identifier.
   * @throws ApplicationError when the identifier is empty.
   */
  private normalizeApplicationId(
    applicationId: string
  ): string {

    const normalizedApplicationId =
      applicationId?.trim().toUpperCase();

    if (!normalizedApplicationId) {
      throw this.createError(
        'INVALID_APPLICATION_ID',
        applicationId,
        'The XTEIN application identifier cannot be empty.'
      );
    }

    return normalizedApplicationId;
  }

  /**
   * Creates a controlled XTEIN application error.
   *
   * @param code Error classification.
   * @param applicationId Application identifier associated with the error.
   * @param message Technical error description.
   * @param remoteName Optional microfrontend name.
   * @param cause Optional original error.
   * @returns Controlled application error.
   */
  private createError(
    code: ApplicationError['code'],
    applicationId: string,
    message: string,
    remoteName?: string,
    cause?: unknown
  ): ApplicationError {

    return {
      code,
      applicationId,
      message,
      remoteName,
      cause
    };
  }
}