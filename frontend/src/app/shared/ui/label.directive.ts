import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'label[appLabel]',
})
export class LabelDirective {
  @HostBinding('class')
  readonly className = 'text-sm font-medium leading-none';
}
