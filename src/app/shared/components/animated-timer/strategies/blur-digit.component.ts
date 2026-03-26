import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DigitState } from '../digit-state';

@Component({
  selector: 'app-blur-digit',
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
      animation: blur-out 200ms ease-in forwards;
    }

    .new.entering {
      animation: blur-in 200ms ease-out 150ms forwards;
      filter: blur(8px);
      opacity: 0;
    }

    @keyframes blur-out {
      0% { filter: blur(0); opacity: 1; }
      100% { filter: blur(8px); opacity: 0; }
    }

    @keyframes blur-in {
      0% { filter: blur(8px); opacity: 0; }
      100% { filter: blur(0); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .old, .new.entering { animation: none !important; }
      .new.entering { filter: none; opacity: 1; }
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
export class BlurDigitComponent {
  state = input.required<DigitState>();
}
