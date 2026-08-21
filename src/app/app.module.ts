import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData, CommonModule  } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

registerLocaleData(localeEs, 'es');

@NgModule({
  declarations: [
    AppComponent
    // Aquí van otros componentes específicos del AppModule
  ],
  imports: [
    BrowserModule,
    SharedModule,
    CommonModule   // <-- Módulo compartido importado
    // Aquí van otros módulos como RouterModule, etc.
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es' }  // <-- Configuración de idioma
    // Aquí van otros providers
  ],
  bootstrap: [AppComponent]  // <-- Componente raíz
})
export class AppModule { }
