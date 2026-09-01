import {
  bootstrapApplication
} from '@angular/platform-browser';

import {
  appConfig
} from './app/app.config';

import {
  App
} from './app/app.component';


bootstrapApplication(
  App,
  appConfig
)
  .catch(
    error =>
      console.error(
        'XTEIN Angular bootstrap failed.',
        error
      )
  );