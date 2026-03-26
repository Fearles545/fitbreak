import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[class.circle]': 'variant() === "circle"',
    '[class.text]': 'variant() === "text"',
  },
  styles: `
    :host {
      display: block;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }

    :host::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--mat-sys-on-surface) 6%, transparent) 50%,
        transparent 100%
      );
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    :host.circle {
      border-radius: 50%;
    }

    :host.text {
      border-radius: 8px;
    }

    @media (prefers-reduced-motion: reduce) {
      :host::after { animation: none; }
    }
  `,
  template: '',
})
export class SkeletonComponent {
  width = input('100%');
  height = input('16px');
  variant = input<'rect' | 'circle' | 'text'>('rect');
}
