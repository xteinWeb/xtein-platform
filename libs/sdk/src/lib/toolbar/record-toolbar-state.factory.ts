import {
  RecordToolbarCapabilities
} from '../contracts/toolbar/record-toolbar-capabilities';

import {
  RecordToolbarMode
} from '../contracts/toolbar/record-toolbar-mode';

import {
  RecordToolbarPermissions
} from '../contracts/toolbar/record-toolbar-permissions';

import {
  ToolbarAction
} from '../contracts/toolbar/toolbar-action';

import {
  ToolbarActionState,
  ToolbarState
} from '../contracts/toolbar/toolbar-state';

import {
  DefaultRecordToolbarCapabilities
} from './record-toolbar-defaults';


/**
 * Defines the information required to calculate the state
 * of a standard XTEIN record toolbar.
 */
export interface RecordToolbarStateOptions {

  /**
   * Application that owns the toolbar.
   */
  applicationId:
    string;

  /**
   * Current functional application mode.
   */
  mode:
    RecordToolbarMode;

  /**
   * Permissions granted to the current user for
   * the application.
   *
   * Permissions are mandatory and must originate from
   * the XTEIN application permission service.
   */
  permissions:
    Readonly<RecordToolbarPermissions>;

  /**
   * Optional application capability overrides.
   *
   * Unspecified capabilities use the standard
   * XTEIN record-toolbar capabilities.
   */
  capabilities?:
    Partial<RecordToolbarCapabilities>;

  /**
   * Zero-based current record index.
   */
  currentIndex?:
    number;

  /**
   * Total number of loaded records.
   */
  totalRecords?:
    number;
}


/**
 * Creates the standard toolbar state for a record-based
 * XTEIN application.
 *
 * The final state combines:
 *
 * - user permissions;
 * - application capabilities;
 * - current application mode;
 * - current record position.
 *
 * @param options Current application toolbar context.
 * @returns Toolbar state consumed by the XTEIN platform.
 */
export function createRecordToolbarState(
  options:
    RecordToolbarStateOptions
): ToolbarState {

  const applicationId =
    normalizeApplicationId(
      options.applicationId
    );

  const capabilities:
    RecordToolbarCapabilities = {

      ...DefaultRecordToolbarCapabilities,
      ...options.capabilities
    };

  const permissions =
    options.permissions;

  const currentIndex =
    Math.max(
      options.currentIndex ?? 0,
      0
    );

  const totalRecords =
    Math.max(
      options.totalRecords ?? 0,
      0
    );

  const hasRecords =
    totalRecords > 0;

  const hasPrevious =
    hasRecords &&
    currentIndex > 0;

  const hasNext =
    hasRecords &&
    currentIndex <
      totalRecords - 1;

  const isCreating =
    options.mode ===
      RecordToolbarMode.Creating;

  const isEditing =
    options.mode ===
      RecordToolbarMode.Editing;

  const isChanging =
    isCreating ||
    isEditing;


  const actions:
    Partial<
      Record<
        ToolbarAction,
        ToolbarActionState
      >
    > = {};


  /*
   * NEW
   *
   * Requires:
   * - application create capability;
   * - user CREATE permission.
   */
  addAction(
    actions,

    ToolbarAction.New,

    capabilities.create &&
      permissions.create,

    !isChanging
  );


  /*
   * EDIT
   *
   * Requires:
   * - application edit capability;
   * - user MODIFY permission.
   */
  addAction(
    actions,

    ToolbarAction.Edit,

    capabilities.edit &&
      permissions.edit,

    !isChanging &&
      hasRecords
  );


  /*
   * SAVE
   *
   * Save is not a direct database permission.
   *
   * It becomes available only after the user has entered
   * a permitted Creating or Editing operation.
   */
  const canSaveCreating =
    isCreating &&
    capabilities.create &&
    permissions.create;

  const canSaveEditing =
    isEditing &&
    capabilities.edit &&
    permissions.edit;

  const canSave =
    canSaveCreating ||
    canSaveEditing;

  addAction(
    actions,

    ToolbarAction.Save,

    canSave,

    canSave
  );


  /*
   * CANCEL
   *
   * Cancel follows the current create/edit operation and
   * therefore uses the same permission context as Save.
   */
  addAction(
    actions,

    ToolbarAction.Cancel,

    canSave,

    canSave
  );


  /*
   * DELETE
   *
   * Requires:
   * - application delete capability;
   * - user DELETE permission.
   */
  addAction(
    actions,

    ToolbarAction.Delete,

    capabilities.delete &&
      permissions.delete,

    !isChanging &&
      hasRecords
  );


  /*
   * SEARCH
   *
   * Requires BUSCAR permission.
   */
  addAction(
    actions,

    ToolbarAction.Search,

    capabilities.search &&
      permissions.search,

    !isChanging
  );


  /*
   * REFRESH
   *
   * Refresh is a platform operation and does not have
   * a dedicated USUARIOS_APL_ASO permission.
   */
  addAction(
    actions,

    ToolbarAction.Refresh,

    capabilities.refresh,

    !isChanging
  );


  /*
   * COPY
   *
   * The existing XTEIN toolbar associates Copy with
   * the CREATE permission.
   */
  addAction(
    actions,

    ToolbarAction.Copy,

    capabilities.copy &&
      permissions.create,

    !isChanging &&
      hasRecords
  );


  /*
   * VIEW
   *
   * The existing XTEIN toolbar associates View with
   * the SEARCH permission.
   */
  addAction(
    actions,

    ToolbarAction.View,

    capabilities.view &&
      permissions.search,

    !isChanging &&
      hasRecords
  );


  /*
   * CONFIGURE
   *
   * Requires CONFIGURAR permission.
   */
  addAction(
    actions,

    ToolbarAction.Configure,

    capabilities.configure &&
      permissions.configure,

    !isChanging
  );


  /*
   * PRINT
   *
   * Existing LISTAR permission maps to the platform
   * Print action.
   */
  addAction(
    actions,

    ToolbarAction.Print,

    capabilities.print &&
      permissions.print,

    !isChanging
  );


  /*
   * RECORD NAVIGATION
   *
   * Navigation is not controlled by a dedicated permission.
   * It depends on application capability and loaded records.
   */
  const navigationVisible =
    capabilities.navigation &&
    hasRecords;

  addAction(
    actions,

    ToolbarAction.First,

    navigationVisible,

    !isChanging &&
      hasPrevious
  );

  addAction(
    actions,

    ToolbarAction.Previous,

    navigationVisible,

    !isChanging &&
      hasPrevious
  );

  addAction(
    actions,

    ToolbarAction.Next,

    navigationVisible,

    !isChanging &&
      hasNext
  );

  addAction(
    actions,

    ToolbarAction.Last,

    navigationVisible,

    !isChanging &&
      hasNext
  );


  return {

    applicationId,

    actions
  };
}


/**
 * Adds an action to the toolbar state when it should
 * be visible.
 *
 * Actions that are not visible are omitted from ToolbarState.
 *
 * @param actions Current toolbar action state collection.
 * @param action Toolbar action.
 * @param visible Indicates whether the action should be rendered.
 * @param enabled Indicates whether the action can currently execute.
 */
function addAction(
  actions:
    Partial<
      Record<
        ToolbarAction,
        ToolbarActionState
      >
    >,

  action:
    ToolbarAction,

  visible:
    boolean,

  enabled:
    boolean
): void {

  if (!visible) {
    return;
  }

  actions[action] = {

    visible:
      true,

    enabled
  };
}


/**
 * Normalizes the application identifier used by ToolbarState.
 *
 * @param applicationId Application identifier.
 * @returns Normalized identifier.
 */
function normalizeApplicationId(
  applicationId:
    string
): string {

  const normalizedApplicationId =
    applicationId
      ?.trim()
      .toUpperCase();

  if (!normalizedApplicationId) {

    throw new Error(
      'The XTEIN application identifier cannot be empty when creating toolbar state.'
    );
  }

  return normalizedApplicationId;
}