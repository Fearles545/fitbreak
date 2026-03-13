import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-strength',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Силове тренування</h1>`,
})
export class StrengthComponent {}
