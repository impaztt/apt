import type { ReactNode } from 'react';
import { Card } from './Card';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: 'default' | 'blue' | 'red' | 'green';
}

const tones = {
  default: 'text-ink',
  blue: 'text-brand-600',
  red: 'text-red-500',
  green: 'text-emerald-600',
};

export function MetricCard({ label, value, note, tone = 'default' }: MetricCardProps) {
  return (
    <Card className="min-h-[116px] p-4 sm:p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`metric-number mt-3 text-xl font-bold sm:text-2xl ${tones[tone]}`}>{value}</p>
      {note && <p className="mt-2 truncate text-xs text-slate-400">{note}</p>}
    </Card>
  );
}
