import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../service/token.service';
import { AuthService } from '../service/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // Ignora endpoints de autenticação
  if (req.url.includes('/auth/login') ||
    req.url.includes('/auth/signup') ||
    req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const accessToken = tokenService.getAccessToken();

  // Se não tem token, continua sem adicionar header
  if (!accessToken) {
    return next(req);
  }

  // Adiciona token ao header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se erro 401 e token expirado, tenta refresh
      if (error.status === 401 && tokenService.isAccessTokenExpired()) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry com novo token
            const newToken = tokenService.getAccessToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
