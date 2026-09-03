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
   */
  permissions:
    Readonly<RecordToolbarPermissions>;

  /**
   * Optional application capability overrides.
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

  const totalRecords =
    Math.max(
      options.totalRecords ?? 0,
      0
    );

  const requestedCurrentIndex =
    Math.max(
      options.currentIndex ?? 0,
      0
    );

  const currentIndex =
    totalRecords > 0
      ? Math.min(
          requestedCurrentIndex,
          totalRecords - 1
        )
      : 0;

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

  const isCopying =
    options.mode ===
      RecordToolbarMode.Copying;

  const isChanging =
    isCreating ||
    isEditing ||
    isCopying;

  const actions:
    Partial<
      Record<
        ToolbarAction,
        ToolbarActionState
      >
    > = {};


  /*
   * NEW
   */
  addAction(
    actions,
    ToolbarAction.New,
    capabilities.create &&
      permissions.create &&
      !isChanging,
    true
  );


  /*
   * EDIT
   */
  addAction(
    actions,
    ToolbarAction.Edit,
    capabilities.edit &&
      permissions.edit &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * COPY
   */
  addAction(
    actions,
    ToolbarAction.Copy,
    capabilities.copy &&
      permissions.create &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * DELETE
   */
  addAction(
    actions,
    ToolbarAction.Delete,
    capabilities.delete &&
      permissions.delete &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * SAVE
   */
  const canSaveCreating =
    isCreating &&
    capabilities.create &&
    permissions.create;

  const canSaveEditing =
    isEditing &&
    capabilities.edit &&
    permissions.edit;

  const canSaveCopying =
    isCopying &&
    capabilities.copy &&
    capabilities.create &&
    permissions.create;

  const canSave =
    canSaveCreating ||
    canSaveEditing ||
    canSaveCopying;

  addAction(
    actions,
    ToolbarAction.Save,
    canSave,
    canSave
  );


  /*
   * CANCEL
   */
  addAction(
    actions,
    ToolbarAction.Cancel,
    canSave,
    canSave
  );


  /*
   * SEARCH
   */
  addAction(
    actions,
    ToolbarAction.Search,
    capabilities.search &&
      permissions.search &&
      !isChanging,
    true
  );


  /*
   * SORT
   */
  addAction(
    actions,
    ToolbarAction.Sort,
    capabilities.sort &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * VIEW
   */
  addAction(
    actions,
    ToolbarAction.View,
    capabilities.view &&
      permissions.search &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * RECORD NAVIGATION
   */
  const navigationVisible =
    capabilities.navigation &&
    hasRecords &&
    !isChanging;

  addAction(
    actions,
    ToolbarAction.First,
    navigationVisible,
    hasPrevious
  );

  addAction(
    actions,
    ToolbarAction.Previous,
    navigationVisible,
    hasPrevious
  );

  addAction(
    actions,
    ToolbarAction.Next,
    navigationVisible,
    hasNext
  );

  addAction(
    actions,
    ToolbarAction.Last,
    navigationVisible,
    hasNext
  );


  /*
   * DOWNLOAD
   */
  addAction(
    actions,
    ToolbarAction.Download,
    capabilities.download &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * PRINT
   */
  addAction(
    actions,
    ToolbarAction.Print,
    capabilities.print &&
      permissions.print &&
      hasRecords &&
      !isChanging,
    true
  );


  /*
   * REFRESH
   *
   * Legacy behavior keeps Refresh available
   * while editing.
   */
  addAction(
    actions,
    ToolbarAction.Refresh,
    capabilities.refresh,
    true
  );


  /*
   * CONFIGURE
   *
   * Legacy behavior also keeps Configure available
   * while editing.
   */
  addAction(
    actions,
    ToolbarAction.Configure,
    capabilities.configure &&
      permissions.configure,
    true
  );


  return {

    applicationId,

    actions,

    record: {

      mode:
        options.mode,

      currentIndex,

      totalRecords
    }
  };
}


/**
 * Adds an action to the toolbar state when it should
 * be visible.
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