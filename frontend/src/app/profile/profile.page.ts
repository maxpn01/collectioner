import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signupSchema } from '@collectioner/shared';
import { z } from 'zod';
import { finalize } from 'rxjs';
import { ButtonDirective } from '../shared/ui/button.directive';
import { AuthService } from '../auth/auth.service';
import { InputDirective } from '../shared/ui/input.directive';
import { LabelDirective } from '../shared/ui/label.directive';
import {
  controlError,
  setServerFormError,
  setZodFormErrors,
  zodControlValidator,
} from '../auth/form-errors';
import { authHttpErrorMessage, signupFieldErrors } from '../auth/http-errors';

const profileSchema = z.object({
  email: signupSchema.shape.email,
  username: signupSchema.shape.username,
  fullname: z
    .string()
    .trim()
    .max(120, 'Full name must be at most 120 characters long')
    .transform((value) => value || null),
});

type ProfileFormValue = {
  email: string;
  username: string;
  fullname: string;
};

type ProfileField = keyof ProfileFormValue;

@Component({
  selector: 'app-profile-page',
  imports: [ButtonDirective, InputDirective, LabelDirective, ReactiveFormsModule],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly signingOut = signal(false);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.formBuilder.group({
    email: ['', [zodControlValidator(profileSchema.shape.email)]],
    username: ['', [zodControlValidator(profileSchema.shape.username)]],
    fullname: ['', [zodControlValidator(z.string().trim().max(120))]],
  });
  readonly displayName = computed(() => {
    const user = this.user();

    return user?.fullname || user?.username || 'Your profile';
  });

  constructor() {
    this.resetForm();
  }

  fieldError(field: ProfileField) {
    const control = this.form.controls[field];

    return controlError(control, this.submitted() || control.touched || control.dirty);
  }

  saveProfile() {
    this.submitted.set(true);
    this.error.set(null);
    this.form.markAllAsTouched();

    const parsed = profileSchema.safeParse(this.form.getRawValue());

    if (!parsed.success) {
      setZodFormErrors(this.form, parsed.error);
      return;
    }

    this.saving.set(true);
    this.auth
      .updateMe(parsed.data)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.submitted.set(false);
          this.resetForm();
        },
        error: (error: unknown) => this.handleSaveError(error),
      });
  }

  signOut() {
    this.signingOut.set(true);
    this.auth
      .signOut()
      .pipe(finalize(() => this.signingOut.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/signin'),
      });
  }

  private resetForm() {
    const user = this.user();

    this.form.reset({
      email: user?.email ?? '',
      username: user?.username ?? '',
      fullname: user?.fullname ?? '',
    });
  }

  private handleSaveError(error: unknown) {
    const fieldErrors = signupFieldErrors(error);
    if (fieldErrors.email) {
      setServerFormError(this.form.controls.email, fieldErrors.email);
    }

    if (fieldErrors.username) {
      setServerFormError(this.form.controls.username, fieldErrors.username);
    }

    this.error.set(
      fieldErrors.email || fieldErrors.username
        ? 'Use different profile details and try again.'
        : authHttpErrorMessage(error),
    );
  }
}
