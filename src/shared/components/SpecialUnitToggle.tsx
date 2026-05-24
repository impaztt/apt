import { Sparkles } from 'lucide-react';
import { Card } from './Card';

export function SpecialUnitToggle({
  checked,
  onChange,
  specialCount,
  embedded = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  specialCount: number;
  embedded?: boolean;
}) {
  const content = (
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex min-w-0 gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <span className="block text-sm font-semibold text-slate-700">펜트·테라스 세대 포함</span>
            <span className="mt-1 block text-[11px] leading-5 text-slate-400">
              기본 통계는 특수세대를 제외합니다.
              {specialCount > 0 ? ` 표식 매물 ${specialCount}건 ${checked ? '포함 중' : '제외 중'}` : ''}
            </span>
          </span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-200'}`}>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
              checked ? 'left-6' : 'left-1'
            }`}
          />
        </span>
      </label>
  );

  if (embedded) return <div className="h-full rounded-3xl border border-slate-100 bg-slate-50 p-4">{content}</div>;
  return <Card className="p-3.5 shadow-none sm:p-5">{content}</Card>;
}
