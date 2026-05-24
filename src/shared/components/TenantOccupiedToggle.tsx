import { KeyRound } from 'lucide-react';
import type { TenantOccupiedFilterMode } from '../../features/listings/types';
import { Card } from './Card';

export function TenantOccupiedToggle({
  mode,
  onChange,
  occupiedCount,
  compact = false,
}: {
  mode: TenantOccupiedFilterMode;
  onChange: (mode: TenantOccupiedFilterMode) => void;
  occupiedCount: number;
  compact?: boolean;
}) {
  const options: { value: TenantOccupiedFilterMode; label: string }[] = [
    { value: 'all', label: '전체 포함' },
    { value: 'exclude', label: '세안고 제외' },
    { value: 'only', label: '세안고만 보기' },
  ];

  if (compact) {
    const compactOptions: { value: TenantOccupiedFilterMode; label: string }[] = [
      { value: 'all', label: '포함' },
      { value: 'exclude', label: '제외' },
      { value: 'only', label: '세안고만' },
    ];
    return (
      <div className="flex items-center justify-between gap-2 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <KeyRound className="h-4 w-4 shrink-0 text-violet-500" />
          <span className="text-sm font-semibold text-slate-700">세안고</span>
          {occupiedCount > 0 && <span className="text-[11px] text-slate-400">{occupiedCount}건</span>}
        </span>
        <div className="flex shrink-0 gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {compactOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded-md px-2 py-1.5 text-[10px] font-semibold transition ${
                mode === option.value ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => onChange(option.value)}
              aria-pressed={mode === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const content = (
      <div className="flex gap-2.5">
        <span className="shrink-0">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700">세안고 매물 표시</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            기본은 전체 포함입니다.{occupiedCount > 0 ? ` 세안고 ${occupiedCount}건이 있습니다.` : ''}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg px-1 py-2 text-[11px] font-semibold transition ${
                  mode === option.value ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
                }`}
                onClick={() => onChange(option.value)}
                aria-pressed={mode === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
  );

  return <Card className="p-3.5 shadow-none sm:p-5">{content}</Card>;
}
