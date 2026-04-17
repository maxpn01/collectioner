import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { signinSchema, type SigninDto } from '@collectioner/shared';
import { finalize } from 'rxjs';
import { controlError, setZodFormErrors, zodControlValidator } from '../form-errors';
import { authHttpErrorMessage } from '../http-errors';
import { AuthService } from '../auth.service';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { InputDirective } from '../../shared/ui/input.directive';
import { LabelDirective } from '../../shared/ui/label.directive';
import { PasswordInputComponent } from '../../shared/ui/password-input.component';

type SigninField = keyof SigninDto;

@Component({
  selector: 'app-signin-page',
  imports: [
    ButtonDirective,
    InputDirective,
    LabelDirective,
    PasswordInputComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './signin.page.html',
})
export class SigninPage {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.group({
    email: ['', [zodControlValidator(signinSchema.shape.email)]],
    password: ['', [zodControlValidator(signinSchema.shape.password)]],
  });
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  private readonly returnUrl = normalizeReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  fieldError(field: SigninField) {
    const control = this.form.controls[field];

    return controlError(control, this.submitted() || control.touched || control.dirty);
  }

  submit() {
    this.submitted.set(true);
    this.serverError.set(null);
    this.form.markAllAsTouched();

    const parsed = signinSchema.safeParse(this.form.getRawValue());

    if (!parsed.success) {
      setZodFormErrors(this.form, parsed.error);
      return;
    }

    this.submitting.set(true);
    this.auth
      .signIn(parsed.data)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl),
        error: (error: unknown) => {
          this.serverError.set(authHttpErrorMessage(error));
        },
      });
  }
}

function normalizeReturnUrl(returnUrl: string | null) {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return '/profile';
  }

  return returnUrl;
}
