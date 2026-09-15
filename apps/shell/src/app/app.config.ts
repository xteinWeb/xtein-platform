import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { XTEIN_API_CONFIG} from '@xtein/api-client';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { XTEIN_REPORTS_URL } from '@xtein/ui';
import { SessionTabsService, XTEIN_SESSION_POLICY } from '@xtein/session';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => inject(SessionTabsService).initialize()),
    { provide: XTEIN_SESSION_POLICY, useValue: environment.session },
    { provide: XTEIN_REPORTS_URL, useValue: environment.reportes },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: XTEIN_API_CONFIG,
      useValue: {
        baseUrl: environment.apiBaseUrl
      }
    }
  ]
};
