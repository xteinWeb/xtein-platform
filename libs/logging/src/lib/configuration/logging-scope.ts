import { InjectionToken } from '@angular/core';
import { LogContext } from '../models/log-event.model';

/** Immutable catalog identity supplied by the shell for each application instance. */
export const XTEIN_LOG_SCOPE = new InjectionToken<Readonly<Pick<LogContext, 'ID_APLICACION' | 'MICROFRONTEND_ID'>>>(
  'XTEIN_LOG_SCOPE', { providedIn: 'root', factory: () => Object.freeze({}) }
);
