import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { signupSchema, type SignupDto } from '@collectioner/shared';
import { finalize } from 'rxjs';
import {
  controlError,
  setServerFormError,
  setZodFormErrors,
  zodControlValidator,
} from '../form-errors';
import { authHttpErrorMessage, signupFieldErrors } from '../http-errors';
import { AuthService } from '../auth.service';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { InputDirective } from '../../shared/ui/input.directive';
import { LabelDirective } from '../../shared/ui/label.directive';
import { PasswordInputComponent } from '../../shared/ui/password-input.component';

type SignupField = keyof SignupDto;

@Component({
  selector: 'app-signup-page',
  imports: [
    ButtonDirective,
    InputDirective,
    LabelDirective,
    PasswordInputComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './signup.page.html',
})
export class SignupPage {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.group({
    email: ['', [zodControlValidator(signupSchema.shape.email)]],
    username: ['', [zodControlValidator(signupSchema.shape.username)]],
    password: ['', [zodControlValidator(signupSchema.shape.password)]],
  });
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  fieldError(field: SignupField) {
    const control = this.form.controls[field];

    return controlError(control, this.submitted() || control.touched || control.dirty);
  }

  submit() {
    this.submitted.set(true);
    this.serverError.set(null);
    this.form.markAllAsTouched();

    const parsed = signupSchema.safeParse(this.form.getRawValue());

    if (!parsed.success) {
      setZodFormErrors(this.form, parsed.error);
      return;
    }

    this.submitting.set(true);
    this.auth
      .signUp(parsed.data)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/profile'),
        error: (error: unknown) => this.handleSubmitError(error),
      });
  }

  private handleSubmitError(error: unknown) {
    const fieldErrors = signupFieldErrors(error);
    const hasFieldErrors = Boolean(fieldErrors.email || fieldErrors.username);

    if (fieldErrors.email) {
      setServerFormError(this.form.controls.email, fieldErrors.email);
    }

    if (fieldErrors.username) {
      setServerFormError(this.form.controls.username, fieldErrors.username);
    }

    this.serverError.set(
      hasFieldErrors ? 'Use different account details and try again.' : authHttpErrorMessage(error),
    );
  }
}
