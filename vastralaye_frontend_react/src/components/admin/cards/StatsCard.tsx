import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatsTone = 'maroon' | 'gold' | 'ok' | 'info' | 'err';

const TONE_CLASSES: Record<StatsTone, string> = {
  maroon: 'bg-maroon/10 text-maroon',
  gold: 'bg-gold/15 text-[#8A6414]',
  ok: 'bg-[#3E6B4F]/10 text-[#3E6B4F]',
  info: 'bg-[#5C6B8A]/10 text-[#5C6B8A]',
  err: 'bg-[#C62828]/10 text-[#C62828]',
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Small tinted icon square (pass a lucide icon element) */
  icon?: ReactNode;
  /** Tint for the icon square */
  tone?: StatsTone;
  /** Percent change vs the previous period; renders a ▲/▼ chip */
  delta?: number | null;
  /** Muted text next to the delta chip */
  deltaLabel?: string;
  className?: string;
}

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  tone = 'maroon',
  delta,
  deltaLabel = 'vs last month',
  className,
}: StatsCardProps) => {
  const hasDelta = typeof delta === 'number' && !Number.isNaN(delta);
  const isUp = hasDelta && (delta as number) >= 0;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 rounded-md border border-border bg-white p-5', className)}>
      {icon && (
        <span
          className={cn(
            'mb-1 flex h-9 w-9 items-center justify-center rounded-lg',
            TONE_CLASSES[tone],
          )}
        >
          {icon}
        </span>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E5F53]">
        {title}
      </p>
      <div className="font-serif text-2xl font-medium leading-tight text-espresso md:text-3xl">
        {value}
      </div>
      {hasDelta ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6E5F53]">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11.5px] font-semibold',
              isUp ? 'bg-[#3E6B4F]/10 text-[#3E6B4F]' : 'bg-[#C62828]/10 text-[#C62828]',
            )}
          >
            {isUp ? '▲' : '▼'} {Math.abs(delta as number).toFixed(1)}%
          </span>
          <span>{deltaLabel}</span>
        </div>
      ) : (
        subtitle && <p className="text-xs text-[#6E5F53]">{subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;
