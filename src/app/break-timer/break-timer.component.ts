import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-break-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Перерва</h1>`,
})
export class BreakTimerComponent {}
