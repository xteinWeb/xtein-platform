import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root',
})

export class GoogleService {
  private CLIENT_ID = '815972521774-m3jqqvj7kap5i2m3vtmhaqgc4h5kpehh.apps.googleusercontent.com'; // Reemplázalo con tu Client ID
  // private API_KEY = 'AIzaSyAHlH7ZjFxCc6RDGfsl2wjaQFuIhXvzvQ8'; // Reemplázalo con tu API Key
  // private DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  private SCOPES = 'https://www.googleapis.com/auth/calendar.events';
  // private CALENDAR_ID = 'c_c81885e2c4242a209f68e2476c34660c4061e0a8731930c7e5873f23fcfa3001@group.calendar.google.com';

  constructor(private oauthService: OAuthService) {
    this.initlogin()
  }


  initlogin() {
    const config: AuthConfig = {
      issuer: 'https://accounts.google.com',
      strictDiscoveryDocumentValidation: false,
      clientId: this.CLIENT_ID,
      redirectUri: window.location.origin + '/home',
      scope: 'openid profile email',
      // scope: this.SCOPES,
    }
    this.oauthService.configure(config);
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }


  loginGoogle() {
    this.oauthService.initLoginFlow();
  }

  logOutGoogle() {
    this.oauthService.logOut();
  }

  getDataProfileGoogle() {
    return this.oauthService.getIdentityClaims()
  }

}
