import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ButtonDirective } from '../shared/ui/button.directive';
import { InputDirective } from '../shared/ui/input.directive';
import { AdminUser } from './admin.models';
import { AdminService } from './admin.service';

const PAGE_SIZE = 20;
const MAX_PAGE_BUTTONS = 8;

type ConfirmationDialog = {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
};

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [ButtonDirective, FormsModule, InputDirective],
  templateUrl: './admin-dashboard.page.html',
})
export class AdminDashboardPage {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly users = signal<AdminUser[]>([]);
  readonly pageN = signal(1);
  readonly lastPageN = signal(1);
  readonly loading = signal(false);
  readonly actionPending = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly goToPageInput = signal('');
  readonly confirmationDialog = signal<ConfirmationDialog | null>(null);

  readonly selectedUsers = computed(() => {
    const selected = this.selectedIds();
    return this.users().filter((user) => selected.has(user.id));
  });
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly selectedIncludesCurrentUser = computed(() => {
    const currentUserId = this.auth.user()?.id;

    return Boolean(currentUserId && this.selectedIds().has(currentUserId));
  });
  readonly hasSelectedRows = computed(() => this.selectedCount() > 0);
  readonly allRowsSelected = computed(() => {
    const users = this.users();
    return users.length > 0 && users.every((user) => this.selectedIds().has(user.id));
  });
  readonly pageButtons = computed(() => this.buildPageButtons());

  constructor() {
    this.loadPage(1);
  }

  loadPage(pageN = this.pageN()) {
    this.loading.set(true);
    this.error.set(null);

    this.admin
      .getUsersPage(pageN, PAGE_SIZE)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dashboard) => {
          const lastPage = Math.max(dashboard.lastPage, 1);
          this.users.set(dashboard.page);
          this.pageN.set(pageN);
          this.lastPageN.set(lastPage);
          this.selectedIds.set(new Set());
        },
        error: () => this.error.set('Unable to load the dashboard.'),
      });
  }

  toggleAllRows(checked: boolean) {
    this.selectedIds.set(checked ? new Set(this.users().map((user) => user.id)) : new Set());
  }

  toggleRow(userId: string, checked: boolean) {
    const selected = new Set(this.selectedIds());

    if (checked) {
      selected.add(userId);
    } else {
      selected.delete(userId);
    }

    this.selectedIds.set(selected);
  }

  setBlocked(targetIds: string[], blocked: boolean) {
    if (!targetIds.length) return;

    this.runAction(() =>
      this.admin
        .setBlocked(targetIds, blocked)
        .pipe(finalize(() => this.actionPending.set(false)))
        .subscribe({
          next: () => this.patchUsers(targetIds, { blocked }),
          error: () => this.error.set('Unable to update blocked status.'),
        }),
    );
  }

  setAdmin(targetIds: string[], isAdmin: boolean) {
    if (!targetIds.length) return;

    this.runAction(() =>
      this.admin
        .setAdmin(targetIds, isAdmin)
        .pipe(finalize(() => this.actionPending.set(false)))
        .subscribe({
          next: () => {
            this.patchUsers(targetIds, { isAdmin });
            this.syncCurrentUserAdmin(targetIds, isAdmin);
          },
          error: () => this.error.set('Unable to update admin status.'),
        }),
    );
  }

  grantAdminToSelected() {
    const targetIds = this.selectedTargetIds();
    if (!targetIds.length) return;

    this.openConfirmation({
      title: 'Grant admin',
      body: 'Are you sure you want to grant admin privileges to the selected users?',
      confirmLabel: 'Grant admin',
      onConfirm: () => this.setAdmin(targetIds, true),
    });
  }

  deleteSelected() {
    const targetIds = this.selectedTargetIds();
    if (!targetIds.length) return;

    this.openConfirmation({
      title: 'Delete',
      body: 'Are you sure you want to delete the selected users?',
      confirmLabel: 'Delete',
      onConfirm: () => this.deleteUsers(targetIds),
    });
  }

  giveUpAdminPrivileges() {
    const currentUser = this.auth.user();
    if (!currentUser?.id) return;

    this.openConfirmation({
      title: 'Give up admin privileges',
      body: 'Are you sure you want to give up your admin privileges?',
      confirmLabel: 'Give up privileges',
      onConfirm: () => this.revokeCurrentUserAdmin(currentUser.id),
    });
  }

  closeConfirmation() {
    if (this.actionPending()) return;

    this.confirmationDialog.set(null);
  }

  confirmDialogAction() {
    const dialog = this.confirmationDialog();
    if (!dialog) return;

    this.confirmationDialog.set(null);
    dialog.onConfirm();
  }

  goToPage() {
    const nextPage = Number.parseInt(this.goToPageInput(), 10);

    if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > this.lastPageN()) {
      this.error.set(`Please input a number between 1 and ${this.lastPageN()}.`);
      return;
    }

    this.loadPage(nextPage);
  }

  selectedTargetIds() {
    return [...this.selectedIds()];
  }

  private openConfirmation(dialog: ConfirmationDialog) {
    this.confirmationDialog.set(dialog);
  }

  private deleteUsers(targetIds: string[]) {
    this.runAction(() =>
      this.admin
        .deleteUsers(targetIds)
        .pipe(finalize(() => this.actionPending.set(false)))
        .subscribe({
          next: () => this.loadPage(this.pageN()),
          error: () => this.error.set('Unable to delete selected users.'),
        }),
    );
  }

  private revokeCurrentUserAdmin(currentUserId: string) {
    this.runAction(() =>
      this.admin
        .setAdmin([currentUserId], false)
        .pipe(finalize(() => this.actionPending.set(false)))
        .subscribe({
          next: () => {
            this.auth.user.update((user) => (user ? { ...user, isAdmin: false } : user));
            void this.router.navigateByUrl('/profile');
          },
          error: () => this.error.set('Unable to give up admin privileges.'),
        }),
    );
  }

  private runAction(start: () => void) {
    this.actionPending.set(true);
    this.error.set(null);
    start();
  }

  private patchUsers(targetIds: string[], patch: Partial<AdminUser>) {
    const targetSet = new Set(targetIds);
    this.users.update((users) =>
      users.map((user) => (targetSet.has(user.id) ? { ...user, ...patch } : user)),
    );
  }

  private syncCurrentUserAdmin(targetIds: string[], isAdmin: boolean) {
    const currentUser = this.auth.user();

    if (currentUser && targetIds.includes(currentUser.id)) {
      this.auth.user.update((user) => (user ? { ...user, isAdmin } : user));
    }
  }

  private buildPageButtons() {
    const pageN = this.pageN();
    const lastPageN = this.lastPageN();
    const half = Math.floor(MAX_PAGE_BUTTONS / 2);
    const pages: number[] = [];

    for (let index = 0; index < MAX_PAGE_BUTTONS; index += 1) {
      const page = pageN - half + index;
      if (page >= 1 && page <= lastPageN) pages.push(page);
    }

    return pages;
  }
}
