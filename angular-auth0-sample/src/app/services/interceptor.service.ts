import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {

  constructor(private auth: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.auth.getTokenSilently$().pipe(
      mergeMap(token => {
        if (token) {
          return next.handle(req.clone({
            setHeaders: { Authorization: `Bearer ${token.__raw}` }
          }));
        } else {
          return next.handle(req);
        }
      }),
      catchError((err) => {
        return next.handle(req);
      })
    );
  }
}
