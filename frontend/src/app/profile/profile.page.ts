import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonDirective } from '../shared/ui/button.directive';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile-page',
  imports: [ButtonDirective],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly signingOut = signal(false);
  readonly error = signal<string | null>(null);
  readonly displayName = computed(() => {
    const user = this.user();

    return user?.fullname || user?.username || 'Your profile';
  });

  signOut() {
    this.signingOut.set(true);
    this.auth
      .signOut()
      .pipe(finalize(() => this.signingOut.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/signin'),
      });
  }
}
