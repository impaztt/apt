import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileJson } from 'lucide-react';
import { summarizeListings } from '../features/listings/statistics';
import type { AreaGroup, DealType, FloorGroup } from '../features/listings/types';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { getAreaGroup } from '../shared/utils/area';
import { formatDate, isStaleDate } from '../shared/utils/date';
import { formatPrice } from '../shared/utils/price';
import { DeleteComplexDialog } from '../features/complexes/components/DeleteComplexDialog';

export function ComplexDetailPage() {
  const { complexId } = useParams();
  const { complexes, listings, loading, error } = useAppData();
  const [areaFilter, setAreaFilter] = useState<AreaGroup | ''>('');
  const [dealFilter, setDealFilter] = useState<DealType | ''>('매매');
  const [floorFilter, setFloorFilter] = useState<FloorGroup | ''>('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [maxPriceEok, setMaxPriceEok] = useState('');
  const complex = complexes.find((item) => item.id === complexId);
  const relatedListings = listings.filter((listing) => listing.complex_id === complexId);
  const summaries = summarizeListings(relatedListings, complex ? [complex] : []);
  const filteredListings = useMemo(
    () =>
      relatedListings
        .filter((listing) => !dealFilter || listing.deal_type === dealFilter)
        .filter((listing) => !areaFilter || getAreaGroup(listing) === areaFilter)
        .filter((listing) => !floorFilter || listing.floor_group === floorFilter)
        .filter((listing) => !directionFilter.trim() || (listing.direction ?? '').includes(directionFilter.trim()))
        .filter((listing) => !maxPriceEok || (listing.price ?? listing.deposit ?? 0) <= Number(maxPriceEok) * 100_000_000)
        .sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER)),
    [relatedListings, dealFilter, areaFilter, floorFilter, directionFilter, maxPriceEok],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!complex) return <EmptyState title="단지를 찾을 수 없습니다" description="단지 목록으로 돌아가 다시 선택해 주세요." />;

  return (
    <div className="space-y-6">
      <Link to="/complexes" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> 단지 목록
      </Link>
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{complex.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{complex.address ?? complex.region ?? '주소 미입력'}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              {complex.brand && <span className="rounded-full bg-slate-50 px-3 py-2">{complex.brand}</span>}
              {complex.built_year && <span className="rounded-full bg-slate-50 px-3 py-2">{complex.built_year}년 준공</span>}
              {complex.household_count && (
                <span className="rounded-full bg-slate-50 px-3 py-2">{complex.household_count.toLocaleString()}세대</span>
              )}
              {complex.legal_dong_code && <span className="rounded-full bg-slate-50 px-3 py-2">법정동 {complex.legal_dong_code}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to={`/data/input?complexId=${complex.id}`}>
              <Button variant="secondary">
                <span className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" /> 이 단지 매물 수정
                </span>
              </Button>
            </Link>
            <DeleteComplexDialog complex={complex} />
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-bold">평형별 매매 호가</h2>
        {summaries.length ? (
          <div className="flex gap-3 overflow-x-auto">
            {summaries.map((summary) => (
              <Card key={summary.area_group} className="min-w-[238px]">
                <p className="text-sm font-semibold text-slate-500">{summary.area_label}</p>
                <p className="metric-number mt-4 text-xl font-bold">{formatPrice(summary.avg_price)}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {formatPrice(summary.min_price)} ~ {formatPrice(summary.max_price)}
                </p>
                <p className="mt-2 text-xs text-slate-400">매물 {summary.listing_count}건</p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="매매 매물이 없습니다" description="현재 호가 데이터를 등록하면 평형 요약이 생성됩니다." />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">매물 목록</h2>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              className="field-control mt-0 py-2.5"
              value={dealFilter}
              onChange={(event) => setDealFilter(event.target.value as DealType | '')}
            >
              <option value="">전체 유형</option>
              <option value="매매">매매</option>
              <option value="전세">전세</option>
              <option value="월세">월세</option>
            </select>
            <select
              className="field-control mt-0 py-2.5"
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value as AreaGroup | '')}
            >
              <option value="">전체 평형</option>
              {summaries.map((summary) => (
                <option key={summary.area_group} value={summary.area_group}>
                  {summary.area_label}
                </option>
              ))}
            </select>
            <select
              className="field-control mt-0 py-2.5"
              value={floorFilter ?? ''}
              onChange={(event) => setFloorFilter((event.target.value || '') as FloorGroup | '')}
            >
              <option value="">전체 층</option>
              <option value="저층">저층</option>
              <option value="중층">중층</option>
              <option value="고층">고층</option>
            </select>
            <input
              className="field-control mt-0 py-2.5"
              inputMode="decimal"
              value={maxPriceEok}
              onChange={(event) => setMaxPriceEok(event.target.value)}
              placeholder="최대가(억)"
            />
            <input
              className="field-control col-span-2 mt-0 py-2.5 sm:max-w-32"
              value={directionFilter}
              onChange={(event) => setDirectionFilter(event.target.value)}
              placeholder="방향 검색"
            />
          </div>
        </div>
        {filteredListings.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredListings.map((listing, index) => (
              <Card key={listing.id} className={isStaleDate(listing.verified_date) ? 'opacity-60' : ''}>
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold">{listing.deal_type}</span>
                      {index === 0 && listing.deal_type === '매매' && (
                        <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600">최저가</span>
                      )}
                      {listing.is_duplicate_candidate && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">중복 의심</span>
                      )}
                      {listing.is_favorite && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">관심</span>
                      )}
                    </div>
                    <p className="metric-number mt-4 text-2xl font-bold">{formatPrice(listing.price ?? listing.deposit)}</p>
                    <p className="mt-3 text-sm text-slate-500">
                      {listing.building_no ?? '-'} · {listing.area_pyeong}평형 (전용 {listing.exclusive_area_pyeong}평) ·{' '}
                      {listing.floor_text ?? listing.floor_group ?? '-'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {listing.direction ?? '방향 미입력'} · 확인 {formatDate(listing.verified_date)} · {listing.source ?? '출처 미입력'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="조건에 맞는 매물이 없습니다" description="필터를 변경하거나 새 매물을 등록해 주세요." />
        )}
      </section>
    </div>
  );
}
