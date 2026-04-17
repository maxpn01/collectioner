import { Component, Input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-password-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: PasswordInputComponent,
    },
  ],
  template: `
    <div class="password-input">
      <input
        class="password-input-control"
        [id]="inputId"
        [type]="visible() ? 'text' : 'password'"
        [autocomplete]="autocomplete"
        [disabled]="disabled()"
        [value]="value()"
        [attr.aria-invalid]="ariaInvalid"
        [attr.aria-describedby]="ariaDescribedby"
        (input)="handleInput($event)"
        (blur)="onTouched()"
      />

      <button
        class="password-toggle"
        type="button"
        [disabled]="disabled()"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="visible()"
        (click)="toggleVisibility()"
      >
        @if (visible()) {
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a19.2 19.2 0 0 1 5.06-6.94"
            />
            <path
              d="M9.9 4.24A10.45 10.45 0 0 1 12 4c5 0 9.27 3.11 11 8a19.13 19.13 0 0 1-3.06 4.56"
            />
            <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </svg>
        } @else {
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      </button>
    </div>
  `,
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input({ required: true }) inputId = '';
  @Input() autocomplete = 'current-password';
  @Input() ariaInvalid: true | null = null;
  @Input() ariaDescribedby: string | null = null;

  readonly value = signal('');
  readonly visible = signal(false);
  readonly disabled = signal(false);

  onChange = (_value: string) => {};
  onTouched = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleInput(event: Event) {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';

    this.value.set(value);
    this.onChange(value);
  }

  toggleVisibility() {
    this.visible.update((visible) => !visible);
  }
}
