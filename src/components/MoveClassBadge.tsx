import { MoveClass } from '../review/classify';
import { t, TranslationKey } from '../i18n';

/** Symbol, color and name per class; colors follow the familiar Chess.com review palette */
export const MOVE_CLASS_META: Record<MoveClass, { symbol: string; color: string; label: TranslationKey }> = {
  brilliant: { symbol: '!!', color: '#1baca6', label: 'review.brilliant' },
  only: { symbol: '!', color: '#5c8bb0', label: 'review.only' },
  best: { symbol: '★', color: '#81b64c', label: 'review.best' },
  excellent: { symbol: '✓', color: '#96bc4b', label: 'review.excellent' },
  good: { symbol: '✓', color: '#95af8a', label: 'review.good' },
  inaccuracy: { symbol: '?!', color: '#f7c631', label: 'review.inaccuracy' },
  mistake: { symbol: '?', color: '#e58f2a', label: 'review.mistake' },
  blunder: { symbol: '??', color: '#ca3431', label: 'review.blunder' },
  forced: { symbol: '□', color: '#9ca3af', label: 'review.forced' },
};

/** Display order, best to worst */
export const MOVE_CLASS_ORDER: MoveClass[] = [
  'brilliant',
  'only',
  'best',
  'excellent',
  'good',
  'forced',
  'inaccuracy',
  'mistake',
  'blunder',
];

interface MoveClassBadgeProps {
  moveClass: MoveClass;
  /** Diameter in px */
  size?: number;
  className?: string;
}

/**
 * Round icon for a move classification, with its name as tooltip
 */
export function MoveClassBadge({ moveClass, size = 16, className = '' }: MoveClassBadgeProps) {
  const meta = MOVE_CLASS_META[moveClass];
  const label = t(meta.label);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center shrink-0 rounded-full font-bold text-white leading-none select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: meta.color,
        fontSize: size * (meta.symbol.length > 1 ? 0.5 : 0.62),
        letterSpacing: meta.symbol.length > 1 ? '-0.05em' : undefined,
      }}
    >
      {meta.symbol}
    </span>
  );
}
