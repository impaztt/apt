import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { AllAreasComparisonCards, ComplexPriceRanking, SelectedAreaHighlights } from '../features/comparisons/components/MobileComparisonCards';
import { PriceRangeSummary } from '../features/comparisons/components/PriceRangeSummary';
import { filterSpecialListings, isSpecialListing, summarizeListings } from '../features/listings/statistics';
import type { AreaSelection } from '../features/listings/types';
import { AreaTabs } from '../shared/components/AreaTabs';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { SpecialUnitToggle } from '../shared/components/SpecialUnitToggle';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { getAreaOptions } from '../shared/utils/area';
import { formatDate } from '../shared/utils/date';

export function ComparisonPage() {
  const { complexes, listings, groups, memberships, latestCapturedDates, loading, error } = useAppData();
  const [groupId, setGroupId] = useState('');
  const [areaGroup, setAreaGroup] = useState<AreaSelection>('all');
  const [includeSpecialUnits, setIncludeSpecialUnits] = useState(false);
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const complexIds = memberships
    .filter((item) => item.group_id === group?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.complex_id);
  const groupListings = listings.filter((listing) => complexIds.includes(listing.complex_id));
  const specialSaleCount = groupListings.filter(
    (listing) => listing.deal_type === '매매' && listing.price !== null && isSpecialListing(listing),
  ).length;
  const analysisListings = filterSpecialListings(listings, includeSpecialUnits);
  const relevantListings = analysisListings.filter((listing) => complexIds.includes(listing.complex_id));
  const areaOptions = getAreaOptions(relevantListings.filter((listing) => listing.deal_type === '매매'));
  const selectedArea = areaOptions.find((area) => area.key === areaGroup);
  const scopeLabel = selectedArea?.label ?? '전체 평형';
  const summaries = summarizeListings(analysisListings, complexes, areaGroup, complexIds);
  const areaSummaries = (selectedGroup: string) => summarizeListings(analysisListings, complexes, selectedGroup, complexIds);
  const capturedDates = complexIds.map((id) => latestCapturedDates[id]).filter((date): date is string => Boolean(date));
  const latestDate = [...capturedDates].sort().pop() ?? null;
  const mismatchedDates = new Set(capturedDates).size > 1;

  useEffect(() => {
    if (areaGroup !== 'all' && !areaOptions.some((option) => option.key === areaGroup)) setAreaGroup('all');
  }, [areaGroup, areaOptions]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!groups.length) return <EmptyState title="비교 그룹이 없습니다" description="먼저 단지 데이터를 추가해 주세요." />;

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="단지 비교"
        description="같은 평형의 실제 호가 위치와 중앙 가격 순위를 모바일에서 빠르게 비교합니다."
        action={
          <select className="field-control mt-0 w-full sm:min-w-[240px]" value={group?.id ?? ''} onChange={(event) => setGroupId(event.target.value)}>
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        }
      />

      <AreaTabs value={areaGroup} options={areaOptions} onChange={setAreaGroup} />

      <SpecialUnitToggle
        checked={includeSpecialUnits}
        onChange={setIncludeSpecialUnits}
        specialCount={specialSaleCount}
      />

      {areaOptions.length ? areaGroup === 'all' ? (
        <AllAreasComparisonCards options={areaOptions} summariesForArea={areaSummaries} onSelect={setAreaGroup} />
      ) : summaries.length ? (
        <>
          <Card className="p-4 shadow-none sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-900">{scopeLabel}</p>
                <p className="mt-1 text-xs text-slate-500">단지 {summaries.length}개 · 매매 매물 {summaries.reduce((total, summary) => total + summary.listing_count, 0)}건</p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
                onClick={() => setAreaGroup('all')}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> 전체
              </button>
            </div>
            <details className={`mt-4 rounded-2xl px-3 py-2.5 text-xs ${mismatchedDates ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> 기준일 {formatDate(latestDate)}</span>
                <span>{mismatchedDates ? '단지별 날짜 다름' : '상세 보기'}</span>
              </summary>
              <div className="mt-3 space-y-1.5">
                {complexIds.map((id) => (
                  <p key={id} className="flex justify-between gap-3">
                    <span className="truncate">{complexes.find((complex) => complex.id === id)?.name ?? id}</span>
                    <span className="shrink-0">{formatDate(latestCapturedDates[id] ?? null)}</span>
                  </p>
                ))}
              </div>
            </details>
          </Card>

          <SelectedAreaHighlights summaries={summaries} />

          <PriceRangeSummary summaries={summaries} listings={analysisListings} title="실제 호가 위치 비교" />

          <ComplexPriceRanking summaries={summaries} />

          <p className="px-1 text-xs leading-5 text-slate-400">호가는 매도 희망 가격이며 단지별 매물 구성과 수집 기준일 차이를 함께 확인해야 합니다.</p>
        </>
      ) : (
        <EmptyState title={`${scopeLabel} 매물이 없습니다`} description="선택한 평형의 매매 스냅샷을 저장해 주세요." />
      ) : (
        <EmptyState title="비교할 매물이 없습니다" description="매매 스냅샷을 저장하면 평형별 비교가 표시됩니다." />
      )}
    </div>
  );
}
