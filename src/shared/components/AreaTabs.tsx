import { AREA_GROUPS, formatAreaGroup } from '../utils/area';
import type { AreaGroup } from '../../features/listings/types';

interface AreaTabsProps {
  value: AreaGroup;
  onChange: (value: AreaGroup) => void;
}

export function AreaTabs({ value, onChange }: AreaTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {AREA_GROUPS.map((area) => (
        <button
          type="button"
          key={area}
          onClick={() => onChange(area)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
            area === value ? 'bg-ink text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
          }`}
        >
          {formatAreaGroup(area)}
        </button>
      ))}
    </div>
  );
}
