import { Injectable } from '@angular/core';

import { ApplicationTreeNode } from '@xtein/sdk';

/**
 * Maintains the applications currently available to the XTEIN platform.
 *
 * Application information originates from the existing backend response
 * and is mapped into the internal platform model before registration.
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationRegistryService {

  /**
   * Stores application nodes using the normalized application identifier
   * as the registry key.
   */
  private readonly applications =
    new Map<string, ApplicationTreeNode>();

  /**
   * Registers or replaces an application node.
   *
   * @param application Application node to register.
   */
  registerApplication(
    application: ApplicationTreeNode
  ): void {

    const applicationId =
      this.normalizeApplicationId(application.applicationId);

    this.applications.set(
      applicationId,
      {
        ...application,
        applicationId
      }
    );
  }

  /**
   * Registers multiple application nodes.
   *
   * @param applications Application nodes to register.
   */
  registerApplications(
    applications: readonly ApplicationTreeNode[]
  ): void {

    applications.forEach(
      application => this.registerApplication(application)
    );
  }

  /**
   * Determines whether an application is registered.
   *
   * @param applicationId Application identifier.
   * @returns True when the application exists.
   */
  hasApplication(applicationId: string): boolean {
    return this.applications.has(
      this.normalizeApplicationId(applicationId)
    );
  }

  /**
   * Returns a registered application.
   *
   * @param applicationId Application identifier.
   * @returns Application node or undefined when not found.
   */
  getApplication(
    applicationId: string
  ): ApplicationTreeNode | undefined {

    return this.applications.get(
      this.normalizeApplicationId(applicationId)
    );
  }

  /**
   * Returns all registered applications.
   *
   * A new array is returned to protect the internal registry.
   */
  getApplications(): readonly ApplicationTreeNode[] {
    return Array.from(this.applications.values());
  }

  /**
   * Clears all registered applications.
   */
  clear(): void {
    this.applications.clear();
  }

  /**
   * Normalizes an application identifier.
   *
   * Application identifiers are provided by the XTEIN database and
   * are treated as canonical identifiers by the platform.
   *
   * @param applicationId Application identifier to normalize.
   * @returns Normalized application identifier.
   * @throws Error when the identifier is empty.
   */
  private normalizeApplicationId(
    applicationId: string
  ): string {

    const normalizedApplicationId =
      applicationId?.trim().toUpperCase();

    if (!normalizedApplicationId) {
      throw new Error(
        'The XTEIN application identifier cannot be empty.'
      );
    }

    return normalizedApplicationId;
  }
}