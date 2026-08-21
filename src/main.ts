import {} from '@angular/common/http';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withDebugTracing, withPreloading } from '@angular/router';
import { APP_ROUTES } from './app/app.routes';
import { OAuthModule } from 'angular-oauth2-oidc';
import 'src/app/shared/components/dashboard/dashboard-icons.ts';


bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),importProvidersFrom(BrowserAnimationsModule, BrowserAnimationsModule, BrowserAnimationsModule, OAuthModule.forRoot()),
    provideRouter(APP_ROUTES,
      withPreloading(PreloadAllModules),
      // withDebugTracing(),
    )]
}).catch(err => console.error(err));
