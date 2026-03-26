import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DigitState } from '../digit-state';

@Component({
  selector: 'app-scale-digit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: relative;
      overflow: hidden;
      display: block;
    }

    .sizer {
      visibility: hidden;
      display: block;
    }

    .value {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .old {
      animation: scale-out 150ms ease-in forwards;
    }

    .new.entering {
      animation: scale-in 150ms ease-out 150ms forwards;
      transform: scale(0);
    }

    @keyframes scale-out {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0); opacity: 0; }
    }

    @keyframes scale-in {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .old, .new.entering { animation: none !important; }
      .new.entering { transform: scale(1); }
    }
  `,
  template: `
    <span class="sizer">0</span>
    @if (state().animating) {
      <span class="value old">{{ state().previous }}</span>
      <span class="value new entering">{{ state().current }}</span>
    } @else {
      <span class="value">{{ state().current }}</span>
    }
  `,
})
export class ScaleDigitComponent {
  state = input.required<DigitState>();
}
