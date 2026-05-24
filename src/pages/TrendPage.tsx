import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HistoryDistributionPlot } from '../features/comparisons/components/HistoryDistributionPlot';
import { TrendLineChart } from '../features/comparisons/components/TrendLineChart';
import {
  compareLatestSnapshots,
  filterSpecialListings,
  filterTenantOccupiedListings,
  isSpecialListing,
  isTenantOccupiedListing,
  summarizeSnapshotHistory,
} from '../features/listings/statistics';
import type { AreaSelection, TenantOccupiedFilterMode } from '../features/listings/types';
import { AreaTabs } from '../shared/components/AreaTabs';
import { Card } from '../shared/components/Card';
import { MetricCard } from '../shared/components/MetricCard';
import { PageHeader } from '../shared/components/PageHeader';
import { SpecialUnitToggle } from '../shared/components/SpecialUnitToggle';
import { TenantOccupiedToggle } from '../shared/components/TenantOccupiedToggle';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { getAreaOptions } from '../shared/utils/area';
import { formatDate } from '../shared/utils/date';
import { formatPrice } from '../shared/utils/price';

export function TrendPage() {
  const { complexes, snapshots, groups, memberships, loading, error } = useAppData();
  const [searchParams] = useSearchParams();
  const requestedArea = searchParams.get('area');
  const [groupId, setGroupId] = useState('');
  const [areaGroup, setAreaGroup] = useState<AreaSelection>(requestedArea ?? 'all');
  const [complexId, setComplexId] = useState('');
  const [includeSpecialUnits, setIncludeSpecialUnits] = useState(false);
  const [tenantOccupiedMode, setTenantOccupiedMode] = useState<TenantOccupiedFilterMode>('all');
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const complexIds = memberships
    .filter((item) => item.group_id === group?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.complex_id);
  const rawGroupSnapshots = snapshots.filter((snapshot) => complexIds.includes(snapshot.complex_id));
  const specialSaleCount = rawGroupSnapshots
    .flatMap((snapshot) => snapshot.listings)
    .filter((listing) => listing.deal_type === '매매' && listing.price !== null && isSpecialListing(listing)).length;
  const tenantOccupiedSaleCount = rawGroupSnapshots
    .flatMap((snapshot) => snapshot.listings)
    .filter((listing) => listing.deal_type === '매매' && listing.price !== null && isTenantOccupiedListing(listing)).length;
  const groupSnapshots = rawGroupSnapshots.map((snapshot) => ({
    ...snapshot,
    listings: filterTenantOccupiedListings(
      filterSpecialListings(snapshot.listings, includeSpecialUnits),
      tenantOccupiedMode,
    ),
  }));
  const historicalListings = groupSnapshots.flatMap((snapshot) => snapshot.listings);
  const areaOptions = getAreaOptions(historicalListings.filter((listing) => listing.deal_type === '매매'));
  const points = areaGroup === 'all' ? [] : summarizeSnapshotHistory(groupSnapshots, complexes, areaGroup, complexIds);
  const changes = compareLatestSnapshots(groupSnapshots, areaGroup, complexIds);
  const selectedComplexId = complexIds.includes(complexId) ? complexId : complexIds[0] ?? '';
  const selectedComplex = complexes.find((complex) => complex.id === selectedComplexId);
  const uniqueDates = [...new Set(groupSnapshots.map((snapshot) => snapshot.captured_date))].sort();

  useEffect(() => {
    if (requestedArea && areaOptions.some((option) => option.key === requestedArea)) {
      setAreaGroup(requestedArea);
    }
  }, [areaOptions, requestedArea]);

  useEffect(() => {
    if (areaOptions.length && (areaGroup === 'all' || !areaOptions.some((option) => option.key === areaGroup))) {
      setAreaGroup(areaOptions[0].key);
    }
  }, [areaGroup, areaOptions]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!groups.length) return <EmptyState title="비교 그룹이 없습니다" description="먼저 단지 데이터를 등록해 주세요." />;

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="호가 변화"
        description="매일 저장한 수집 기준일별 스냅샷으로 중앙값, 최저 호가, 매물 수와 가격 분포 이동을 확인합니다."
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

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <MetricCard label="수집일 수" value={`${uniqueDates.length}일`} note="저장된 기준일" />
        <MetricCard label="최초 수집일" value={formatDate(uniqueDates[0] ?? null)} note="기간 시작" />
        <MetricCard label="최근 수집일" value={formatDate(uniqueDates[uniqueDates.length - 1] ?? null)} note="기간 종료" />
        <MetricCard label="누적 스냅샷" value={`${groupSnapshots.length}개`} note="단지별 날짜 자료" />
      </div>

      <SpecialUnitToggle
        checked={includeSpecialUnits}
        onChange={setIncludeSpecialUnits}
        specialCount={specialSaleCount}
      />

      <TenantOccupiedToggle
        mode={tenantOccupiedMode}
        onChange={setTenantOccupiedMode}
        occupiedCount={tenantOccupiedSaleCount}
      />

      {areaOptions.length ? (
        <>
          <Card className="bg-brand-50 p-4 shadow-none sm:p-6">
            <p className="text-sm font-semibold text-brand-700">분석할 평형 선택</p>
            <p className="mt-2 text-sm text-slate-500">기간 변화는 동일 평형만 비교합니다. 아래에서 평형을 선택하세요.</p>
            <div className="mt-4">
              <AreaTabs value={areaGroup} options={areaOptions} onChange={setAreaGroup} showAll={false} />
            </div>
          </Card>

          {areaGroup !== 'all' && points.length ? (
            <>
              <Card className="p-4 shadow-none sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">가격대 분포 변화 확인 단지</h2>
                    <p className="mt-1 text-xs text-slate-400">저가 또는 고가 구간의 매물 수가 날짜별로 어떻게 달라지는지 확인합니다.</p>
                  </div>
                  <select className="field-control mt-0 sm:max-w-[280px]" value={selectedComplexId} onChange={(event) => setComplexId(event.target.value)}>
                    {complexIds.map((id) => (
                      <option key={id} value={id}>
                        {complexes.find((complex) => complex.id === id)?.name ?? id}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
              {selectedComplex && (
                <HistoryDistributionPlot
                  snapshots={groupSnapshots}
                  complexId={selectedComplexId}
                  areaGroup={areaGroup}
                  complexName={selectedComplex.name}
                  color={selectedComplex.color}
                />
              )}
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendLineChart points={points} complexIds={complexIds} metric="median_price" title="중앙값 호가 변화" />
                <TrendLineChart points={points} complexIds={complexIds} metric="min_price" title="최저 호가 변화" />
                <TrendLineChart points={points} complexIds={complexIds} metric="listing_count" title="매물 수 변화" />
              </div>
              <section>
                <h2 className="mb-4 text-lg font-bold">최근 수집일 대비 매물 변화 후보</h2>
                {changes.length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {changes.map((change) => (
                    <Card key={change.complex_id} className="p-4 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{change.complex_name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(change.previous_date)} → {formatDate(change.current_date)}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                          신규 {change.added.length} · 사라짐 {change.removed.length} · 가격변경 {change.repriced.length}
                        </p>
                      </div>
                      {!change.added.length && !change.removed.length && !change.repriced.length ? (
                        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">동일 조건 기준으로 변동 후보가 없습니다.</p>
                      ) : (
                        <div className="mt-4 space-y-3 text-xs">
                          {change.repriced.slice(0, 3).map((item) => (
                            <p key={`repriced-${item.after.id}`} className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
                              가격변경 후보 · {item.after.building_no ?? '-'} {item.after.floor_text ?? ''} · {formatPrice(item.before.price)} →{' '}
                              {formatPrice(item.after.price)}
                            </p>
                          ))}
                          {change.added.slice(0, 3).map((listing) => (
                            <p key={`added-${listing.id}`} className="rounded-xl bg-blue-50 px-3 py-2 text-brand-700">
                              신규 후보 · {listing.building_no ?? '-'} {listing.floor_text ?? ''} · {formatPrice(listing.price)}
                            </p>
                          ))}
                          {change.removed.slice(0, 3).map((listing) => (
                            <p key={`removed-${listing.id}`} className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                              사라짐 후보 · {listing.building_no ?? '-'} {listing.floor_text ?? ''} · {formatPrice(listing.price)}
                            </p>
                          ))}
                        </div>
                      )}
                    </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-slate-50 shadow-none">
                    <p className="text-sm text-slate-500">같은 단지의 스냅샷이 두 날짜 이상 저장되면 신규·사라진·가격 변경 후보를 표시합니다.</p>
                  </Card>
                )}
                {changes.length > 0 && (
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    같은 동·거래유형·평형·층·방향을 기준으로 비교한 후보입니다. 중개사 중복 등록 또는 문구 변경으로 실제 동일 매물과 다를 수 있습니다.
                  </p>
                )}
              </section>
            </>
          ) : (
            <EmptyState title="선택 평형의 기간 데이터가 없습니다" description="해당 평형 매물 스냅샷을 두 날짜 이상 저장하면 변화가 표시됩니다." />
          )}
        </>
      ) : (
        <EmptyState title="기간 분석할 매물이 없습니다" description="JSON 입력 화면에서 수집 기준일을 지정해 매매 데이터를 저장해 주세요." />
      )}
    </div>
  );
}
