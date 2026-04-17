import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import type { z } from 'zod';

type SafeParseSchema = {
  safeParse: (
    value: unknown,
  ) =>
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ message: string }> } };
};

export function zodControlValidator(schema: SafeParseSchema): ValidatorFn {
  return (control: AbstractControl) => {
    const result = schema.safeParse(control.value);

    if (result.success) return null;

    return {
      zod: result.error.issues[0]?.message ?? 'Invalid value',
    };
  };
}

export function setZodFormErrors<T extends Record<string, AbstractControl>>(
  form: FormGroup<T>,
  error: z.ZodError,
) {
  for (const issue of error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName !== 'string') continue;

    const control = form.get(fieldName);

    if (!control) continue;

    control.setErrors({
      ...(control.errors ?? {}),
      zod: issue.message,
    });
  }
}

export function setServerFormError(control: AbstractControl | null, message: string) {
  control?.setErrors({
    ...(control.errors ?? {}),
    server: message,
  });
}

export function controlError(control: AbstractControl | null, shouldShow: boolean): string | null {
  if (!control || !shouldShow || !control.errors) return null;

  const errors = control.errors;

  return (
    getStringError(errors['server']) ??
    getStringError(errors['zod']) ??
    getStringError(errors['required']) ??
    null
  );
}

function getStringError(value: unknown) {
  return typeof value === 'string' ? value : null;
}
