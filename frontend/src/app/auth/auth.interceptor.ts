import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApiRequest = req.url.startsWith('/api/');
  const token = auth.accessToken();
  let authReq = req;

  if (isApiRequest) {
    authReq = authReq.clone({ withCredentials: true });
  }

  if (isApiRequest && token && !req.headers.has('Authorization')) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !isApiRequest ||
        isAuthEndpoint(req.url)
      ) {
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((accessToken) =>
          next(
            authReq.clone({
              setHeaders: {
                Authorization: `Bearer ${accessToken}`,
              },
              withCredentials: true,
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function isAuthEndpoint(url: string) {
  return (
    url.startsWith('/api/auth/signin') ||
    url.startsWith('/api/auth/signup') ||
    url.startsWith('/api/auth/signout') ||
    url.startsWith('/api/auth/refresh')
  );
}
