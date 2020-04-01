import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { iif, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      concatMap(_ => this.authService.handleAuthCallback()),
      concatMap(result => iif(() => result.loggedIn, of(true), this.authService.login(state.url).pipe(map(() => false)))));
  }
}
