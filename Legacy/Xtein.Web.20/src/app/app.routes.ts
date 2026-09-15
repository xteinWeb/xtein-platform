import { inject } from "@angular/core";
import { Routes } from "@angular/router";
import { DefaultLayoutComponent } from "./containers/default-layout";
import { PrincipalComponent } from "./containers/default-layout/principal/principal.component";
import { SbarraService } from "./containers/regbarra/_sbarra.service";
import { TabContentComponent } from "./containers/tabs/tab-content.component";
import { TabService } from "./containers/tabs/tab.service";
import { RutasGuardGuard } from "./shared/guards/rutas-guard.guard";
import { P404Component } from "./views/error/404.component";
import { P500Component } from "./views/error/500.component";
import { LoginComponent } from "./views/login/login.component";
import { NewLoginComponent } from "./views/new_login/new_login.component";

export const APP_ROUTES: Routes = [
  { path: '',
    component: NewLoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: DefaultLayoutComponent,
    canActivate: [RutasGuardGuard],
    providers: [TabService],
    children: [
      { path: 'principal', component: PrincipalComponent },
      { path: 'tabcompo', component: TabContentComponent }
    ]
  },
  { path: 'newLogin', component: LoginComponent },
  { path: '404', component: P404Component },
  { path: '500', component: P500Component },
  { path: '**', component: P404Component }
];