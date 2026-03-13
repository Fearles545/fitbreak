import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Прогрес</h1>`,
})
export class ProgressComponent {}
