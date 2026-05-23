import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { listComplexes } from '../../features/complexes/api';
import type { ApartmentComplex } from '../../features/complexes/types';
import { listComparisonGroups, listGroupMemberships } from '../../features/comparisons/api';
import type { ComparisonGroup, ComparisonGroupComplex } from '../../features/comparisons/types';
import { listListings } from '../../features/listings/api';
import type { ApartmentListing } from '../../features/listings/types';

interface AppDataValue {
  complexes: ApartmentComplex[];
  listings: ApartmentListing[];
  groups: ComparisonGroup[];
  memberships: ComparisonGroupComplex[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [complexes, setComplexes] = useState<ApartmentComplex[]>([]);
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [memberships, setMemberships] = useState<ComparisonGroupComplex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextComplexes, nextListings, nextGroups, nextMemberships] = await Promise.all([
        listComplexes(),
        listListings(),
        listComparisonGroups(),
        listGroupMemberships(),
      ]);
      setComplexes(nextComplexes);
      setListings(nextListings);
      setGroups(nextGroups);
      setMemberships(nextMemberships);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ complexes, listings, groups, memberships, loading, error, reload }),
    [complexes, listings, groups, memberships, loading, error, reload],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider.');
  return context;
}
