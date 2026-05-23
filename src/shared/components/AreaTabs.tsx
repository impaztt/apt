import type { AreaSelection } from '../../features/listings/types';
import type { AreaOption } from '../utils/area';
import { ALL_AREAS } from '../utils/area';

interface AreaTabsProps {
  value: AreaSelection;
  options: AreaOption[];
  onChange: (value: AreaSelection) => void;
  showAll?: boolean;
}

export function AreaTabs({ value, options, onChange, showAll = true }: AreaTabsProps) {
  const tabs = [
    ...(showAll ? [{ key: ALL_AREAS, label: '전체' }] : []),
    ...options.map((option) => ({ key: option.key, label: option.label })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((area) => (
        <button
          type="button"
          key={area.key}
          onClick={() => onChange(area.key)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
            area.key === value ? 'bg-ink text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
          }`}
        >
          {area.label}
        </button>
      ))}
    </div>
  );
}
