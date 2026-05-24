import { KeyRound } from 'lucide-react';
import { Card } from './Card';

export function TenantOccupiedToggle({
  checked,
  onChange,
  occupiedCount,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  occupiedCount: number;
}) {
  return (
    <Card className="p-3.5 shadow-none sm:p-5">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex min-w-0 gap-2.5">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <span>
            <span className="block text-sm font-semibold text-slate-700">세안고 매물 포함</span>
            <span className="mt-1 block text-[11px] leading-5 text-slate-400">
              기본 통계는 세입자가 있는 매물을 제외합니다.
              {occupiedCount > 0 ? ` 세안고 ${occupiedCount}건 ${checked ? '포함 중' : '제외 중'}` : ''}
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
    </Card>
  );
}
