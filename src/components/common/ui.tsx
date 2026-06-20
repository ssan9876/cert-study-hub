// Small shared UI primitives used across the app. Kept dependency-free and
// theme-aware (every color has a dark-mode variant).

import type { ReactNode } from 'react';
import type { Difficulty, DomainName } from '../../types/Question';
import { getDomainMeta } from '../../services/QuestionService';

/** A rounded Fluent-style surface card. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-fluent dark:border-navy-700 dark:bg-navy-800 ${className}`}
    >
      {children}
    </div>
  );
}

const difficultyTone: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${difficultyTone[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

export function DomainBadge({ domain }: { domain: DomainName }) {
  const meta = getDomainMeta(domain);
  const color = meta?.color ?? '#4d99ff';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {meta?.shortName ?? domain}
    </span>
  );
}

/** 1–5 star confidence selector (read-only when onChange is omitted). */
export function ConfidenceStars({
  value,
  onChange,
}: {
  value?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Confidence ${n}`}
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className={`text-lg leading-none transition-transform ${
            onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          } ${value && n <= value ? 'text-amber-400' : 'text-slate-300 dark:text-navy-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/** Horizontal progress bar. `value` and `max` are absolute counts. */
export function ProgressBar({
  value,
  max,
  className = '',
  color = '#1a7aff',
}: {
  value: number;
  max: number;
  className?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-700 ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** A labelled statistic tile. */
export function StatTile({
  label,
  value,
  hint,
  accent = '#1a7aff',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </Card>
  );
}
