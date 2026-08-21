import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class RutasGuardGuard  {
  
  // constructor (private router: Router){ }
  
  // redirect(flag: boolean): any {
  //   if(!flag) {
  //     this.router.navigate(['/'])
  //   }
  // }
  
  // canActivate(
  //   route: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //   let ACCESS: boolean;      
  //   if ("token" in localStorage) {
  //     ACCESS = true;
  //   } else {
  //     ACCESS = false;
  //   }
  //   return ACCESS;
  // }
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    
    const hasToken = localStorage.getItem('token') !== null;

    if (hasToken) {
      return true;
    } else {
      // Redirige al login si no hay token
      // this.router.navigate(['/']);
      // return false;
      return this.router.parseUrl('/');
    }
  }
  
}
