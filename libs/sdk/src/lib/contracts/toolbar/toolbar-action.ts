/**
 * Defines the standard actions available in the XTEIN platform toolbar.
 *
 * Applications receive these actions through the platform SDK without
 * depending on the Shell toolbar implementation.
 */
export const ToolbarAction = {
  Initialize: 'initialize',
  New: 'new',
  Edit: 'edit',
  Save: 'save',
  Cancel: 'cancel',
  Delete: 'delete',
  Refresh: 'refresh',
  First: 'first',
  Previous: 'previous',
  Next: 'next',
  Last: 'last',
  Print: 'print'
} as const;

/**
 * Represents a valid XTEIN toolbar action.
 */
export type ToolbarAction =
  typeof ToolbarAction[keyof typeof ToolbarAction];