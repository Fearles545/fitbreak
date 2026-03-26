export interface DigitState {
  current: number;
  previous: number;
  animating: boolean;
}

export type AnimationMode = 'roll' | 'fade' | 'scale' | 'blur' | 'slot';
