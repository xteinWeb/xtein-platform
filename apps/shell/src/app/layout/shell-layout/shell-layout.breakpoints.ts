/**
 * Viewports where the main navigation sidebar stops taking
 * layout space when expanded and floats over the workspace
 * instead (phones and portrait tablets).
 *
 * Must stay in sync with the compact block of
 * shell-layout.component.scss.
 */
export const SHELL_COMPACT_MEDIA_QUERY =
  '(max-width: 991.98px)';


/**
 * Indicates whether the current viewport uses the compact
 * Shell layout.
 */
export function isShellCompactViewport():
  boolean {

  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(
      SHELL_COMPACT_MEDIA_QUERY
    ).matches;
}
