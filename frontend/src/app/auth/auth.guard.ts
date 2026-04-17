import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.bootstrapSession().pipe(
    map((user) => {
      if (user) return true;

      return router.createUrlTree(['/signin'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth
    .bootstrapSession()
    .pipe(map((user) => (user ? router.createUrlTree(['/profile']) : true)));
};
