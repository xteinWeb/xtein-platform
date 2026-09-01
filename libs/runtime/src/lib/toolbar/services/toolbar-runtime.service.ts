import {
  computed,
  Injectable,
  signal
} from '@angular/core';

import {
  Observable,
  Subject,
  filter
} from 'rxjs';

import {
  ToolbarAction,
  ToolbarCommand,
  ToolbarState
} from '@xtein/sdk';


/**
 * Maintains the toolbar runtime state independently for every
 * application opened in the XTEIN workspace.
 *
 * Because an application can only have one workspace tab,
 * applicationId is the unique key used to preserve its
 * toolbar state and route toolbar commands.
 */
@Injectable({
  providedIn: 'root'
})
export class ToolbarRuntimeService {

  /**
   * Toolbar states indexed by application identifier.
   */
  private readonly states =
    signal<
      ReadonlyMap<
        string,
        ToolbarState
      >
    >(
      new Map<
        string,
        ToolbarState
      >()
    );


  /**
   * Application currently active in the workspace.
   */
  private readonly activeApplicationIdState =
    signal<
      string | null
    >(
      null
    );


  /**
   * Internal toolbar command channel.
   *
   * Commands are dispatched only after validating that:
   *
   * - an application is active;
   * - the application has a ToolbarState;
   * - the requested action exists;
   * - the requested action is visible;
   * - the requested action is enabled.
   */
  private readonly commandsSubject =
    new Subject<
      ToolbarCommand
    >();


  /**
   * Read-only identifier of the active application.
   */
  readonly activeApplicationId =
    this.activeApplicationIdState
      .asReadonly();


  /**
   * Toolbar state associated with the currently active
   * workspace application.
   *
   * PlatformToolbar consumes this value.
   */
  readonly activeToolbarState =
    computed<
      ToolbarState | null
    >(
      () => {

        const applicationId =
          this.activeApplicationIdState();

        if (!applicationId) {

          return null;
        }

        return (
          this.states()
            .get(
              applicationId
            ) ??
          null
        );
      }
    );


  /**
   * Global read-only stream of toolbar commands.
   *
   * Applications should normally use commandsForApplication()
   * instead of subscribing directly to this stream.
   */
  readonly commands:
    Observable<ToolbarCommand> =
      this.commandsSubject
        .asObservable();


  /**
   * Stores or replaces the toolbar state of an application.
   *
   * Updating an inactive application does not change the
   * toolbar currently displayed by the Shell.
   *
   * @param state Toolbar state to store.
   */
  setState(
    state:
      ToolbarState
  ): void {

    const applicationId =
      this.normalizeApplicationId(
        state.applicationId
      );

    const updatedStates =
      new Map(
        this.states()
      );

    updatedStates.set(
      applicationId,
      {
        ...state,
        applicationId
      }
    );

    this.states.set(
      updatedStates
    );
  }


  /**
   * Returns the toolbar state stored for an application.
   *
   * @param applicationId Application identifier.
   * @returns Stored toolbar state or undefined.
   */
  getState(
    applicationId:
      string
  ): ToolbarState | undefined {

    return this.states()
      .get(
        this.normalizeApplicationId(
          applicationId
        )
      );
  }


  /**
   * Indicates whether an application already has a
   * published toolbar state.
   *
   * @param applicationId Application identifier.
   * @returns True when toolbar state exists.
   */
  hasState(
    applicationId:
      string
  ): boolean {

    return this.states()
      .has(
        this.normalizeApplicationId(
          applicationId
        )
      );
  }


  /**
   * Activates the toolbar state belonging to an application.
   *
   * Toolbar states belonging to other opened applications
   * remain preserved.
   *
   * @param applicationId Application identifier.
   */
  activateApplication(
    applicationId:
      string
  ): void {

    this.activeApplicationIdState.set(
      this.normalizeApplicationId(
        applicationId
      )
    );
  }


  /**
   * Returns a command stream containing only commands directed
   * to one specific XTEIN application.
   *
   * This is the preferred subscription mechanism for
   * microfrontend applications.
   *
   * @param applicationId Application identifier.
   * @returns Application-specific toolbar command stream.
   */
  commandsForApplication(
    applicationId:
      string
  ): Observable<
    ToolbarCommand
  > {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );

    return this.commands
      .pipe(

        filter(
          command =>
            command.applicationId ===
            normalizedApplicationId
        )
      );
  }


  /**
   * Dispatches a toolbar action to the currently active
   * workspace application.
   *
   * The command is emitted only when the current ToolbarState
   * declares the action as both visible and enabled.
   *
   * @param action Toolbar action requested by the user.
   * @param payload Optional action-specific information.
   * @returns True when the command was dispatched.
   */
  dispatchAction(
    action:
      ToolbarAction,

    payload?:
      unknown
  ): boolean {

    const applicationId =
      this.activeApplicationIdState();

    if (!applicationId) {

      return false;
    }


    const toolbarState =
      this.states()
        .get(
          applicationId
        );

    if (!toolbarState) {

      return false;
    }


    const actionState =
      toolbarState.actions[
        action
      ];

    if (
      !actionState ||
      !actionState.visible ||
      !actionState.enabled
    ) {

      return false;
    }


    const command:
      ToolbarCommand = {

        applicationId,

        action
      };


    if (
      payload !==
        undefined
    ) {

      command.payload =
        payload;
    }


    this.commandsSubject
      .next(
        command
      );


    return true;
  }


  /**
   * Removes the toolbar state associated with a closed
   * workspace application.
   *
   * @param applicationId Application identifier.
   */
  removeApplication(
    applicationId:
      string
  ): void {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );

    const updatedStates =
      new Map(
        this.states()
      );

    updatedStates.delete(
      normalizedApplicationId
    );

    this.states.set(
      updatedStates
    );


    if (
      this.activeApplicationIdState() ===
        normalizedApplicationId
    ) {

      this.activeApplicationIdState.set(
        null
      );
    }
  }


  /**
   * Clears every toolbar runtime state.
   *
   * Intended for logout or complete workspace reset.
   *
   * The command stream itself remains alive because the runtime
   * service continues to exist for the lifetime of the platform.
   */
  clear(): void {

    this.states.set(
      new Map<
        string,
        ToolbarState
      >()
    );

    this.activeApplicationIdState.set(
      null
    );
  }


  /**
   * Normalizes an application identifier.
   *
   * @param applicationId Application identifier.
   * @returns Normalized identifier.
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
        'The XTEIN application identifier cannot be empty in ToolbarRuntimeService.'
      );
    }

    return normalizedApplicationId;
  }
}