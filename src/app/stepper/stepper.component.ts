import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Степер</h1>`,
})
export class StepperComponent {}
