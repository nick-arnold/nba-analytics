import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  const token = auth.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.getRefreshToken()) {
        return http.post('/api/auth/refresh/', { refresh: auth.getRefreshToken() }).pipe(
          switchMap((res: any) => {
            auth.updateAccessToken(res.access);
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${res.access}` }
            });
            return next(retried);
          }),
          catchError((refreshError) => {
            auth.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};