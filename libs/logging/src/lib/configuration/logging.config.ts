import { InjectionToken } from '@angular/core';
export interface LoggingConfig {
  endpoint: string;
  identity: () => { companyId: string; userId: string; token: string } | null;
}
export const XTEIN_LOGGING_CONFIG = new InjectionToken<LoggingConfig>('XTEIN_LOGGING_CONFIG');
