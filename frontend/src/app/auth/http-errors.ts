import { HttpErrorResponse } from '@angular/common/http';

export type SignupFieldErrors = {
  email?: string;
  username?: string;
};

export function authHttpErrorMessage(error: unknown) {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Try again.';
  }

  if (error.status === 0) {
    return 'Cannot reach the API. Check that the backend is running.';
  }

  if (error.status === 401) {
    return 'Email or password is incorrect.';
  }

  if (error.status === 400) {
    return 'Some fields need attention.';
  }

  if (error.status === 409) {
    return 'This account cannot be created with those details.';
  }

  return 'Something went wrong. Try again.';
}

export function signupFieldErrors(error: unknown): SignupFieldErrors {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409) return {};

  const details = getObjectMessage(error.error);

  return {
    email: details['emailIsTaken'] ? 'Email is already in use.' : undefined,
    username: details['usernameIsTaken'] ? 'Username is already in use.' : undefined,
  };
}

function getObjectMessage(body: unknown): Record<string, unknown> {
  if (!isObject(body)) return {};

  const message = body['message'];

  if (isObject(message)) return message;

  return body;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
