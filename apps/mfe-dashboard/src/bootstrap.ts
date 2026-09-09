import { bootstrapApplication } from '@angular/platform-browser';
import '@xtein/api-client';
import '@xtein/dashboard-runtime';
import '@xtein/runtime';
import '@xtein/sdk';
import '@xtein/session';
import '@xtein/ui';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch(error => console.error(error));
