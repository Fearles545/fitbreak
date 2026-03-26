import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DigitState } from '../digit-state';

@Component({
  selector: 'app-roll-digit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: relative;
      overflow: hidden;
      display: block;
      height: 1em;
    }

    .sizer {
      visibility: hidden;
      display: block;
    }

    .strip {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 300ms ease-in-out;
    }

    .strip-digit {
      height: 1em;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .strip { transition: none !important; }
    }
  `,
  template: `
    <span class="sizer">0</span>
    <div class="strip"
         [style.transform]="'translateY(-' + state().current + 'em)'"
         [style.transition]="state().animating ? '' : 'none'">
      @for (n of digits; track n) {
        <div class="strip-digit">{{ n }}</div>
      }
    </div>
  `,
})
export class RollDigitComponent {
  state = input.required<DigitState>();
  readonly digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}
