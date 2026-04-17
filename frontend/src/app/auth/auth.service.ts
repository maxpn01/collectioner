import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { type AuthResponse, type SigninDto, type SignupDto } from '@collectioner/shared';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { AuthUser } from './auth.models';

const ACCESS_TOKEN_KEY = 'collectioner.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private refreshRequest$: Observable<string> | null = null;

  readonly accessToken = signal<string | null>(this.readStoredToken());
  readonly user = signal<AuthUser | null>(null);
  readonly isSignedIn = computed(() => Boolean(this.accessToken()));

  signUp(payload: SignupDto) {
    return this.http
      .post<AuthResponse>('/api/auth/signup', payload, { withCredentials: true })
      .pipe(
        tap((response) => this.storeAccessToken(response.accessToken)),
        switchMap(() => this.loadMe()),
      );
  }

  signIn(payload: SigninDto) {
    return this.http
      .post<AuthResponse>('/api/auth/signin', payload, { withCredentials: true })
      .pipe(
        tap((response) => this.storeAccessToken(response.accessToken)),
        switchMap(() => this.loadMe()),
      );
  }

  signOut() {
    return this.http.post<void>('/api/auth/signout', {}, { withCredentials: true }).pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearSession()),
    );
  }

  loadMe() {
    return this.http
      .get<AuthUser>('/api/users/me', { withCredentials: true })
      .pipe(tap((user) => this.user.set(user)));
  }

  updateMe(payload: { email: string; username: string; fullname: string | null }) {
    return this.http
      .patch<AuthUser>('/api/users/me', payload, { withCredentials: true })
      .pipe(tap((user) => this.user.set(user)));
  }

  refreshAccessToken() {
    if (this.refreshRequest$) return this.refreshRequest$;

    this.refreshRequest$ = this.http
      .post<AuthResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        map((response) => response.accessToken),
        tap((token) => this.storeAccessToken(token)),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshRequest$;
  }

  bootstrapSession(): Observable<AuthUser | null> {
    const existingUser = this.user();

    if (existingUser) return of(existingUser);

    if (this.accessToken()) {
      return this.loadMe().pipe(
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
      );
    }

    return this.refreshAccessToken().pipe(
      switchMap(() => this.loadMe()),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  storeAccessToken(token: string) {
    this.accessToken.set(token);

    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      return;
    }
  }

  clearSession() {
    this.accessToken.set(null);
    this.user.set(null);

    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      return;
    }
  }

  private readStoredToken() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
