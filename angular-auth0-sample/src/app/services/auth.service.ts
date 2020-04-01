import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { from, iif, Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, concatMap, map, shareReplay, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  refreshSub: Subscription;

  auth0Client$: Observable<Auth0Client> = from(
    createAuth0Client({
     domain: environment.auth.domain,
     client_id: environment.auth.clientId,
     redirect_uri: environment.auth.redirectUrl,
     prompt: 'login'
   })).pipe(shareReplay(1), catchError(err => throwError(err)));

  isAuthenticated$ = this.auth0Client$.pipe(concatMap((client: Auth0Client) =>
    from(client.isAuthenticated())));

  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback())));

  constructor(public router: Router) {}

  getTokenSilently$(options?): Observable<IdToken> {
    return this.auth0Client$.pipe(concatMap((client: Auth0Client) =>
      from(client.getIdTokenClaims(options))));
  }

  login(redirectPath: string = '/'): Observable<void> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) =>
        client.loginWithRedirect({
        redirect_uri: environment.auth.redirectUrl,
        appState: { target: redirectPath }
      })));
  }

  handleAuthCallback(): Observable<{ loggedIn: boolean; targetUrl: string }> {
     return of(window.location.search).pipe(
        concatMap((params: string) => iif(() => params.includes('code=') && params.includes('state='),
           this.handleRedirectCallback$.pipe(concatMap(cbRes =>
              this.isAuthenticated$.pipe(take(1),
                map(loggedIn => ({ loggedIn,
              targetUrl: cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/'
            }))))),
          this.isAuthenticated$.pipe(take(1), map(loggedIn => ({ loggedIn, targetUrl: null }))))));
  }

  logout() {
   this.auth0Client$.subscribe((client: Auth0Client) => {
     client.logout({
       client_id: environment.auth.clientId ,
       returnTo: `${window.location.origin}`
    });
  });
 }
}
