import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AdminUser, AdminUsersPage } from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getUsersPage(pageN: number, size: number) {
    const params = new HttpParams().set('pageN', pageN).set('size', size);

    return this.http.get<AdminUsersPage>('/api/users', { params });
  }

  setBlocked(targetIds: string[], blocked: boolean) {
    return this.http.patch<Pick<AdminUser, 'id' | 'username' | 'fullname' | 'blocked'>[]>(
      '/api/users/block',
      { targetIds, blocked },
    );
  }

  setAdmin(targetIds: string[], isAdmin: boolean) {
    return this.http.patch<Pick<AdminUser, 'id' | 'username' | 'fullname' | 'isAdmin'>[]>(
      '/api/users/admin',
      { targetIds, isAdmin },
    );
  }

  deleteUsers(targetIds: string[]) {
    return this.http.delete<void>('/api/users/delete', { body: { targetIds } });
  }
}
