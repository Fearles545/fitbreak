import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DigitState } from '../digit-state';

@Component({
  selector: 'app-fade-digit',
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
      animation: fade-out 250ms ease-out forwards;
    }

    .new.entering {
      animation: fade-in 250ms ease-in forwards;
      opacity: 0;
    }

    @keyframes fade-out {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-0.3em); }
    }

    @keyframes fade-in {
      0% { opacity: 0; transform: translateY(0.3em); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .old, .new.entering { animation: none !important; }
      .new.entering { opacity: 1; }
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
export class FadeDigitComponent {
  state = input.required<DigitState>();
}
