import {
  CreateRecordToolbarStateOptions,
  createRecordToolbarState
} from '../contracts/toolbar/record-toolbar-state';

import {
  ToolbarState
} from '../contracts/toolbar/toolbar-state';


/**
 * Backward-compatible platform helper for building
 * standard XTEIN record-toolbar state.
 *
 * New and migrated applications can use either
 * createRecordToolbarState or buildToolbarState.
 */
export function buildToolbarState(
  options:
    CreateRecordToolbarStateOptions
): ToolbarState {

  return createRecordToolbarState(
    options
  );
}