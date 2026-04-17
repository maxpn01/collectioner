import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'input[appInput]',
})
export class InputDirective {
  @HostBinding('class')
  readonly className =
    'h-11 rounded-md border border-input bg-background px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
}
