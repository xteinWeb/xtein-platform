import {
  ToolbarAction
} from './toolbar-action';

import {
  RecordToolbarCapabilities,
  DefaultRecordToolbarCapabilities
} from './record-toolbar-capabilities';

import {
  RecordToolbarMode
} from './record-toolbar-mode';

import {
  RecordToolbarPermissions
} from './record-toolbar-permissions';

import {
  ToolbarActionState,
  ToolbarState
} from './toolbar-state';


/**
 * Options used to create the standard toolbar state
 * for an application.
 */
export interface CreateRecordToolbarStateOptions {

  /**
   * Application that owns the state.
   */
  applicationId:
    string;


  /**
   * Current application mode.
   */
  mode:
    RecordToolbarMode;


  /**
   * Current user permissions for the application.
   */
  permissions:
    Readonly<RecordToolbarPermissions>;


  /**
   * Functional toolbar capabilities implemented by
   * the application.
   */
  capabilities?:
    Partial<RecordToolbarCapabilities>;


  /**
   * Zero-based current record index.
   */
  currentIndex:
    number;


  /**
   * Total available records.
   */
  totalRecords:
    number;


  /**
   * Indicates whether unsaved modifications exist.
   */
  dirty?:
    boolean;
}


/**
 * Creates the standard XTEIN toolbar state.
 *
 * This function combines:
 *
 * - Current toolbar mode.
 * - User permissions.
 * - Application capabilities.
 * - Record-navigation state.
 *
 * Applications therefore do not need to reproduce the
 * platform toolbar rules independently.
 */
export function createRecordToolbarState(
  options:
    CreateRecordToolbarStateOptions
): ToolbarState {

  const capabilities:
    RecordToolbarCapabilities = {

      ...DefaultRecordToolbarCapabilities,

      ...options.capabilities
    };


  const currentIndex =
    normalizeCurrentIndex(
      options.currentIndex,
      options.totalRecords
    );


  const totalRecords =
    normalizeTotalRecords(
      options.totalRecords
    );


  const hasRecords =
    totalRecords > 0;


  const hasPreviousRecord =
    hasRecords &&
    currentIndex > 0;


  const hasNextRecord =
    hasRecords &&
    currentIndex <
      totalRecords - 1;


  const actions:
    Partial<
      Record<
        ToolbarAction,
        ToolbarActionState
      >
    > = {};


  const addAction =
    (
      action:
        ToolbarAction,

      visible:
        boolean,

      enabled:
        boolean = visible
    ): void => {

      actions[
        action
      ] = {

        visible,

        enabled:
          visible &&
          enabled
      };
    };


  switch (
    options.mode
  ) {

    /*
     * ================================================================
     * INITIAL
     * ================================================================
     */
    case RecordToolbarMode.Initial:

      addAction(
        ToolbarAction.New,
        capabilities.create &&
        options.permissions.create
      );


      addAction(
        ToolbarAction.Edit,
        capabilities.edit &&
        options.permissions.edit &&
        hasRecords,
        hasRecords
      );


      addAction(
        ToolbarAction.Search,
        capabilities.search &&
        options.permissions.search
      );


      addAction(
        ToolbarAction.Refresh,
        capabilities.refresh
      );


      addAction(
        ToolbarAction.Configure,
        capabilities.configure &&
        options.permissions.configure
      );

      break;


    /*
     * ================================================================
     * BROWSING
     * ================================================================
     */
    case RecordToolbarMode.Browsing:

      addAction(
        ToolbarAction.New,
        capabilities.create &&
        options.permissions.create
      );


      addAction(
        ToolbarAction.Edit,
        capabilities.edit &&
        options.permissions.edit,
        hasRecords
      );


      /*
       * Legacy Copy uses the create permission.
       */
      addAction(
        ToolbarAction.Copy,
        capabilities.copy &&
        options.permissions.create,
        hasRecords
      );


      addAction(
        ToolbarAction.Delete,
        capabilities.delete &&
        options.permissions.delete,
        hasRecords
      );


      addAction(
        ToolbarAction.Search,
        capabilities.search &&
        options.permissions.search
      );


      /*
       * Quick view follows the search permission because
       * the existing backend has no independent r_vista right.
       */
      addAction(
        ToolbarAction.View,
        capabilities.view &&
        options.permissions.search,
        hasRecords
      );


      addAction(
        ToolbarAction.Sort,
        capabilities.sort,
        hasRecords
      );


      addAction(
        ToolbarAction.First,
        capabilities.navigation,
        hasPreviousRecord
      );


      addAction(
        ToolbarAction.Previous,
        capabilities.navigation,
        hasPreviousRecord
      );


      addAction(
        ToolbarAction.GoTo,
        capabilities.navigation,
        hasRecords
      );


      addAction(
        ToolbarAction.Next,
        capabilities.navigation,
        hasNextRecord
      );


      addAction(
        ToolbarAction.Last,
        capabilities.navigation,
        hasNextRecord
      );


      addAction(
        ToolbarAction.Print,
        capabilities.print &&
        options.permissions.print,
        hasRecords
      );


      /*
       * Download follows print/report permission because
       * there is no independent legacy download permission.
       */
      addAction(
        ToolbarAction.Download,
        capabilities.download &&
        options.permissions.print,
        hasRecords
      );


      addAction(
        ToolbarAction.Refresh,
        capabilities.refresh
      );


      addAction(
        ToolbarAction.Configure,
        capabilities.configure &&
        options.permissions.configure
      );

      break;


    /*
     * ================================================================
     * CREATING
     * ================================================================
     */
    case RecordToolbarMode.Creating:

      addAction(
        ToolbarAction.Save,
        capabilities.create &&
        options.permissions.create
      );


      addAction(
        ToolbarAction.Cancel,
        true
      );


      addAction(
        ToolbarAction.Refresh,
        capabilities.refresh
      );


      addAction(
        ToolbarAction.Configure,
        capabilities.configure &&
        options.permissions.configure
      );

      break;


    /*
     * ================================================================
     * EDITING
     * ================================================================
     */
    case RecordToolbarMode.Editing:

      addAction(
        ToolbarAction.Save,
        capabilities.edit &&
        options.permissions.edit
      );


      addAction(
        ToolbarAction.Cancel,
        true
      );


      addAction(
        ToolbarAction.Refresh,
        capabilities.refresh
      );


      addAction(
        ToolbarAction.Configure,
        capabilities.configure &&
        options.permissions.configure
      );

      break;


    /*
     * ================================================================
     * COPYING
     * ================================================================
     */
    case RecordToolbarMode.Copying:

      addAction(
        ToolbarAction.Save,
        capabilities.copy &&
        options.permissions.create
      );


      addAction(
        ToolbarAction.Cancel,
        true
      );


      addAction(
        ToolbarAction.Refresh,
        capabilities.refresh
      );


      addAction(
        ToolbarAction.Configure,
        capabilities.configure &&
        options.permissions.configure
      );

      break;
  }


  return {

    applicationId:
      options.applicationId,

    actions,

    record: {

      mode:
        options.mode,

      currentIndex,

      totalRecords
    },

    dirty:
      options.dirty ??
      (
        options.mode ===
          RecordToolbarMode.Creating ||
        options.mode ===
          RecordToolbarMode.Editing ||
        options.mode ===
          RecordToolbarMode.Copying
      )
  };
}


/**
 * Normalizes the total record count.
 */
function normalizeTotalRecords(
  totalRecords:
    number
): number {

  if (
    !Number.isFinite(
      totalRecords
    ) ||
    totalRecords <= 0
  ) {

    return 0;
  }


  return Math.floor(
    totalRecords
  );
}


/**
 * Normalizes the current zero-based record index.
 */
function normalizeCurrentIndex(
  currentIndex:
    number,

  totalRecords:
    number
): number {

  const normalizedTotalRecords =
    normalizeTotalRecords(
      totalRecords
    );


  if (
    normalizedTotalRecords === 0
  ) {

    return 0;
  }


  if (
    !Number.isFinite(
      currentIndex
    )
  ) {

    return 0;
  }


  const normalizedIndex =
    Math.floor(
      currentIndex
    );


  if (
    normalizedIndex < 0
  ) {

    return 0;
  }


  if (
    normalizedIndex >=
      normalizedTotalRecords
  ) {

    return normalizedTotalRecords - 1;
  }


  return normalizedIndex;
}