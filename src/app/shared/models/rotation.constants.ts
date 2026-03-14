import type { MicroBreakRotation } from './fitbreak.models';

export interface RotationInfo {
  key: MicroBreakRotation;
  name: string;
  icon: string;
  defaultDurationMin: number;
}

export const ROTATION_ORDER: MicroBreakRotation[] = [
  'neck-eyes', 'thoracic-shoulders', 'hips-lower-back', 'active',
];

export const ROTATION_INFO: Record<MicroBreakRotation, RotationInfo> = {
  'neck-eyes': { key: 'neck-eyes', name: 'Шия + Очі', icon: '👁️', defaultDurationMin: 3 },
  'thoracic-shoulders': { key: 'thoracic-shoulders', name: 'Грудний відділ + Плечі', icon: '🦴', defaultDurationMin: 4 },
  'hips-lower-back': { key: 'hips-lower-back', name: 'Стегна + Поперек', icon: '🦵', defaultDurationMin: 4 },
  'active': { key: 'active', name: 'Активна розминка', icon: '⚡', defaultDurationMin: 3 },
};
