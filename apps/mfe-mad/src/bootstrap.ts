import {
  bootstrapApplication
} from '@angular/platform-browser';


/**
 * XTEIN platform mappings used by dynamically loaded MAD applications.
 *
 * MAD applications are resolved after bootstrap through
 * MadApplicationRegistry. Native Federation's unused-dependency
 * analysis starts from the application entry point and cannot
 * otherwise detect every workspace mapping used exclusively by
 * dynamically imported applications.
 *
 * These imports ensure that the platform mappings remain registered
 * as shared dependencies while still allowing unused npm packages
 * to be excluded from federation artifacts.
 *
 * This file is loaded only after initFederation() has completed,
 * so shared mappings are already available through the federation
 * runtime when these imports are resolved.
 */
import '@xtein/api-client';
import '@xtein/runtime';
import '@xtein/sdk';
import '@xtein/session';
import '@xtein/ui';


import {
  appConfig
} from './app/app.config';

import {
  App
} from './app/app';


bootstrapApplication(
  App,
  appConfig
)
  .catch(
    error =>
      console.error(
        error
      )
  );