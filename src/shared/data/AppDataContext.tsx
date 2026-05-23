import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import type { ApartmentComplex } from '../../features/complexes/types';
import type { ComparisonGroup, ComparisonGroupComplex } from '../../features/comparisons/types';
import type { ApartmentListing, ListingSnapshot } from '../../features/listings/types';
import type { DisplaySettings } from '../../features/settings/types';
import { loadStaticDataset } from './staticData';

interface AppDataValue {
  complexes: ApartmentComplex[];
  listings: ApartmentListing[];
  snapshots: ListingSnapshot[];
  latestCapturedDates: Record<string, string>;
  groups: ComparisonGroup[];
  memberships: ComparisonGroupComplex[];
  displaySettings: DisplaySettings;
  loading: boolean;
  error: string | null;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const value = useMemo<AppDataValue>(() => {
    try {
      const data = loadStaticDataset();
      return { ...data, loading: false, error: null };
    } catch (caught) {
      return {
        complexes: [],
        listings: [],
        snapshots: [],
        latestCapturedDates: {},
        groups: [],
        memberships: [],
        displaySettings: { updated_at: '', complex_colors: {}, area_groups: [] },
        loading: false,
        error: caught instanceof Error ? caught.message : 'JSON 데이터를 불러오지 못했습니다.',
      };
    }
  }, []);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider.');
  return context;
}
