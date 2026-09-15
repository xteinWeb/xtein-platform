import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';


registerLocaleData(localeEs, 'es');

@NgModule({
	imports: [BrowserModule],
	providers: [
		{ provide: LOCALE_ID, useValue: 'es' }
	],
	bootstrap: [],
	declarations: [
  ],
})
export class AppModule { }
