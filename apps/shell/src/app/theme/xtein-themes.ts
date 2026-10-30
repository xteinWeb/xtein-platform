/**
 * Visual themes of the XTEIN platform.
 *
 * A theme is applied in two layers:
 * - the XTEIN color tokens, selected with the data-xt-theme
 *   attribute on <html> (libs/ui/src/styles/xtein-tokens.scss);
 * - the matching DevExtreme theme, loaded as an extra stylesheet
 *   over the default material blue light one.
 *
 * Themes belong to a user: the login page always shows the default
 * theme, and a user's stored theme applies once they sign in.
 *
 * This file has no Angular dependency, so main.ts can apply the
 * theme before the application starts.
 */

export type XteinThemeId =
  | 'claro-azul'
  | 'oscuro'
  | 'claro-verde'
  | 'claro-morado';


export interface XteinTheme {

  readonly id: XteinThemeId;

  readonly name: string;

  /**
   * Sample color shown in the theme selector.
   */
  readonly swatch: string;

  /**
   * DevExtreme stylesheet built as a separate bundle in angular.json,
   * or null for the default theme already included in the styles.
   */
  readonly devExtremeStylesheet: string | null;
}


export const XTEIN_THEMES: readonly XteinTheme[] = [
  { id: 'claro-azul', name: 'Claro azul', swatch: '#0f4c81', devExtremeStylesheet: null },
  { id: 'oscuro', name: 'Oscuro', swatch: '#1d222b', devExtremeStylesheet: 'dx-theme-oscuro.css' },
  { id: 'claro-verde', name: 'Claro verde', swatch: '#0f766e', devExtremeStylesheet: 'dx-theme-claro-verde.css' },
  { id: 'claro-morado', name: 'Claro morado', swatch: '#5b2a86', devExtremeStylesheet: 'dx-theme-claro-morado.css' }
];


export const DEFAULT_THEME: XteinThemeId =
  'claro-azul';


const USER_THEME_KEY_PREFIX =
  'xtein.theme.user.';

const DEVEXTREME_LINK_ID =
  'xt-devextreme-theme';


export function findTheme(
  id: string | null | undefined
): XteinTheme | undefined {

  return XTEIN_THEMES.find(
    theme => theme.id === id
  );
}


/**
 * Applies a theme to the document: the token attribute and the
 * DevExtreme stylesheet.
 */
export function applyTheme(
  id: XteinThemeId
): void {

  const theme =
    findTheme(id) ?? findTheme(DEFAULT_THEME)!;

  const root =
    document.documentElement;

  if (theme.id === DEFAULT_THEME) {
    root.removeAttribute('data-xt-theme');
  } else {
    root.setAttribute('data-xt-theme', theme.id);
  }

  let link =
    document.getElementById(DEVEXTREME_LINK_ID) as HTMLLinkElement | null;

  if (!theme.devExtremeStylesheet) {
    link?.remove();
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.id = DEVEXTREME_LINK_ID;
    link.rel = 'stylesheet';
    // After the bundled styles, so it overrides the default DevExtreme theme.
    document.head.appendChild(link);
  }

  if (link.getAttribute('href') !== theme.devExtremeStylesheet) {
    link.setAttribute('href', theme.devExtremeStylesheet);
  }
}


export function readStoredTheme(
  userId: string | null | undefined
): XteinThemeId | null {

  if (!userId?.trim()) {
    return null;
  }

  try {
    return findTheme(
      localStorage.getItem(USER_THEME_KEY_PREFIX + userId.trim().toUpperCase())
    )?.id ?? null;
  } catch {
    return null;
  }
}


/**
 * Theme to show for a user, or the default one when nobody is signed in.
 */
export function themeForUser(
  userId: string | null | undefined
): XteinThemeId {

  return readStoredTheme(userId) ?? DEFAULT_THEME;
}


/**
 * Stores the theme chosen by a user.
 */
export function storeTheme(
  id: XteinThemeId,
  userId: string | null | undefined
): void {

  if (!userId?.trim()) {
    return;
  }

  try {
    localStorage.setItem(USER_THEME_KEY_PREFIX + userId.trim().toUpperCase(), id);
  } catch {
    // Without storage the theme still applies for this visit.
  }
}


/**
 * Applies the theme of the user whose session this tab keeps, or the
 * default one on the login page, as early as possible.
 */
export function applyStoredTheme(): void {

  let userId: string | null = null;

  try {
    // Same key as SESSION_STORAGE_KEYS.userId in @xtein/session; read
    // directly because shared libraries load only after federation starts.
    userId = sessionStorage.getItem('usuario');
  } catch {
    // Without storage nobody is signed in.
  }

  applyTheme(
    themeForUser(userId)
  );
}
