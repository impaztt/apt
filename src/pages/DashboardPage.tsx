import { Link } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { AveragePriceChart } from '../features/comparisons/components/AveragePriceChart';
import { PriceRangeChart } from '../features/comparisons/components/PriceRangeChart';
import { summarizeListings, getGroupAverage } from '../features/listings/statistics';
import type { AreaGroup } from '../features/listings/types';
import { AreaTabs } from '../shared/components/AreaTabs';
import { Card } from '../shared/components/Card';
import { MetricCard } from '../shared/components/MetricCard';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { formatDate } from '../shared/utils/date';
import { formatPrice } from '../shared/utils/price';
import { useState } from 'react';

export function DashboardPage() {
  const { complexes, listings, groups, memberships, loading, error } = useAppData();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [areaGroup, setAreaGroup] = useState<AreaGroup>('84');
  const activeGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const complexIds = memberships
    .filter((membership) => membership.group_id === activeGroup?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((membership) => membership.complex_id);
  const summaries = summarizeListings(listings, complexes, areaGroup, complexIds);
  const relevantListings = listings.filter((listing) => complexIds.includes(listing.complex_id));
  const containsSampleData = relevantListings.some((listing) => listing.source === '샘플 데이터');
  const areaListingCount = summaries.reduce((total, summary) => total + summary.listing_count, 0);
  const lowest = summaries.length ? Math.min(...summaries.map((summary) => summary.min_price)) : null;
  const highest = summaries.length ? Math.max(...summaries.map((summary) => summary.max_price)) : null;
  const average = getGroupAverage(summaries);
  const verifiedDates = relevantListings
    .map((listing) => listing.verified_date)
    .filter((date): date is string => date !== null)
    .sort();
  const latestDate = verifiedDates[verifiedDates.length - 1] ?? null;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!groups.length) {
    return (
      <EmptyState
        title="비교 그룹이 없습니다"
        description="그룹 관리에서 비교할 단지를 묶으면 대시보드 통계가 표시됩니다."
      />
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={activeGroup?.name ?? '단지 비교 대시보드'}
        description="단지별 JSON 파일에 저장된 매매 호가를 전용면적별로 비교합니다. 호가는 실거래 가격이 아닙니다."
        action={
          <select
            className="field-control mt-0 min-w-[240px]"
            value={activeGroup?.id ?? ''}
            onChange={(event) => setSelectedGroupId(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        }
      />

      {containsSampleData && (
        <Card className="border border-amber-100 bg-amber-50 shadow-none">
          <p className="text-sm font-semibold text-amber-800">현재 샘플 JSON 데이터가 표시되고 있습니다.</p>
          <p className="mt-2 text-sm leading-6 text-amber-700">
            실제 분석 전 <code className="rounded bg-white px-1.5 py-0.5 text-xs">src/data/complexes/*.json</code> 파일을
            실제 매물 데이터로 교체해 주세요.
          </p>
        </Card>
      )}

      <AreaTabs value={areaGroup} onChange={setAreaGroup} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="비교 단지" value={`${complexIds.length}개`} note={`전체 매물 ${relevantListings.length}건`} />
        <MetricCard label={`전용 ${areaGroup}㎡ 최저가`} value={formatPrice(lowest)} tone="blue" note="현재 최저 호가" />
        <MetricCard label={`전용 ${areaGroup}㎡ 평균가`} value={formatPrice(average)} note={`매물 ${areaListingCount}건`} />
        <MetricCard label="최근 확인일" value={formatDate(latestDate)} note="수기 입력 데이터 기준" />
      </div>

      {summaries.length ? (
        <>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">전용 {areaGroup}㎡ 단지별 요약</h2>
              <Link to="/compare" className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                상세 비교 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {summaries.map((summary, index) => (
                <Card key={summary.complex_id} className="min-w-[264px] flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate pr-3 text-sm font-semibold">{summary.complex_name}</p>
                    {index === 0 && (
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-600">
                        평균 최저
                      </span>
                    )}
                  </div>
                  <p className="metric-number mt-5 text-2xl font-bold">{formatPrice(summary.avg_price)}</p>
                  <div className="mt-5 flex justify-between text-xs">
                    <span className="text-brand-600">최저 {formatPrice(summary.min_price)}</span>
                    <span className="text-slate-500">최고 {formatPrice(summary.max_price)}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    매물 {summary.listing_count}건 · 확인 {formatDate(summary.latest_verified_date)}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <PriceRangeChart summaries={summaries} />
            <AveragePriceChart summaries={summaries} />
          </div>

          <Card className="flex gap-3 bg-slate-50 shadow-none">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm leading-6 text-slate-500">
              {highest !== null
                ? `선택 평형의 현재 최고 호가는 ${formatPrice(highest)}입니다. `
                : ''}
              이 화면은 입력된 호가를 비교하는 참고 도구이며 매수·매도 추천이나 가치평가 결과가 아닙니다.
            </p>
          </Card>
        </>
      ) : (
        <EmptyState
          title={`전용 ${areaGroup}㎡ 매물이 없습니다`}
          description="단지 JSON 파일에 해당 면적의 매매 호가를 추가한 뒤 재배포해 주세요."
        />
      )}
    </div>
  );
}
