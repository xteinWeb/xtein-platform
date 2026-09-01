import {
  Injectable,
  signal
} from '@angular/core';

import {
  finalize
} from 'rxjs';

import {
  ApplicationTreeNode
} from '@xtein/sdk';

import {
  ApplicationRegistryService
} from '@xtein/runtime';

import {
  ApplicationTreeApiService
} from '../data-access/services/application-tree-api.service';

/**
 * Maintains the application navigation state used by the XTEIN Shell.
 *
 * Backend communication remains delegated to ApplicationTreeApiService.
 *
 * Loaded application nodes are also registered in the platform runtime
 * so they can later be resolved and launched from the workspace.
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationNavigationService {

  /**
   * Internal application-tree state.
   */
  private readonly itemsState =
    signal<ApplicationTreeNode[]>([]);

  /**
   * Internal loading state.
   */
  private readonly loadingState =
    signal(false);

  /**
   * Internal navigation error state.
   */
  private readonly errorState =
    signal<string | null>(null);

  /**
   * Read-only application tree exposed to UI components.
   */
  readonly items =
    this.itemsState.asReadonly();

  /**
   * Indicates whether the application tree is being loaded.
   */
  readonly loading =
    this.loadingState.asReadonly();

  /**
   * Current navigation loading error.
   */
  readonly error =
    this.errorState.asReadonly();

  constructor(
    private readonly applicationTreeApi:
      ApplicationTreeApiService,

    private readonly applicationRegistry:
      ApplicationRegistryService
  ) {
  }

  /**
   * Loads the application tree available to the
   * current authenticated user.
   *
   * The resulting nodes are stored both in the Shell navigation
   * state and in the runtime application registry.
   */
  load(): void {

    if (this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    this.applicationTreeApi
      .load()
      .pipe(
        finalize(() =>
          this.loadingState.set(false)
        )
      )
      .subscribe({

        next: items => {

          /*
           * Replace the runtime registry with the applications
           * currently authorized for the authenticated user.
           */
          this.applicationRegistry.clear();

          this.applicationRegistry
            .registerApplications(
              items
            );

          /*
           * Publish the same normalized collection to the Shell UI.
           */
          this.itemsState.set(
            items
          );
        },

        error: error => {

          /*
           * Never leave stale navigation or runtime registrations
           * after a failed reload.
           */
          this.applicationRegistry.clear();

          this.itemsState.set([]);

          this.errorState.set(
            this.getErrorMessage(
              error
            )
          );
        }

      });
  }

  /**
   * Clears the current navigation and runtime application state.
   *
   * This method should be used after logout or when the active
   * company/session context changes.
   */
  clear(): void {

    this.applicationRegistry.clear();

    this.itemsState.set([]);
    this.errorState.set(null);
    this.loadingState.set(false);
  }

  /**
   * Returns one application-tree node by identifier.
   *
   * @param applicationId XTEIN application identifier.
   * @returns Matching node or undefined.
   */
  findByApplicationId(
    applicationId: string
  ): ApplicationTreeNode | undefined {

    const normalizedApplicationId =
      applicationId
        .trim()
        .toUpperCase();

    if (!normalizedApplicationId) {
      return undefined;
    }

    return this.itemsState()
      .find(item =>
        item.applicationId
          .trim()
          .toUpperCase() ===
        normalizedApplicationId
      );
  }

  /**
   * Converts an unknown loading error into a user-facing message.
   *
   * @param error Loading error.
   * @returns Normalized error message.
   */
  private getErrorMessage(
    error: unknown
  ): string {

    if (
      error instanceof Error &&
      error.message.trim()
    ) {

      return error.message.trim();
    }

    if (
      error !== null &&
      typeof error === 'object'
    ) {

      const record =
        error as Record<
          string,
          unknown
        >;

      const backendMessage =
        record['message'];

      if (
        typeof backendMessage === 'string' &&
        backendMessage.trim()
      ) {

        return backendMessage.trim();
      }
    }

    return 'Unable to load the XTEIN application tree.';
  }
}