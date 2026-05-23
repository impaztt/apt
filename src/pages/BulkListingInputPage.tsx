import { useState } from 'react';
import { CheckCircle2, FileJson, TriangleAlert } from 'lucide-react';
import { createListings } from '../features/listings/api';
import type { ApartmentComplex } from '../features/complexes/types';
import type { DealType, FloorGroup, ListingInput } from '../features/listings/types';
import { validateListingInput } from '../features/listings/validation';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { formatPrice } from '../shared/utils/price';

interface PreviewRow {
  input: ListingInput;
  complexName: string;
  errors: string[];
}

const sampleJson = JSON.stringify(
  [
    {
      complex_name: '화서역푸르지오더에듀포레',
      building_no: '108동',
      deal_type: '매매',
      price: 670000000,
      exclusive_area_m2: 59,
      floor: 2,
      total_floor: 25,
      direction: '남동향',
      verified_date: '2026-05-23',
      source: '네이버부동산',
    },
  ],
  null,
  2,
);

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.replace(/,/g, '')))) {
    return Number(value.replace(/,/g, ''));
  }
  return null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function convertRow(raw: Record<string, unknown>, complexes: ApartmentComplex[]): PreviewRow {
  const complex = complexes.find(
    (item) => item.id === raw.complex_id || item.name === stringValue(raw.complex_name),
  );
  const rawDealType = stringValue(raw.deal_type);
  const validDealType = rawDealType === '매매' || rawDealType === '전세' || rawDealType === '월세';
  const dealType: DealType = validDealType ? rawDealType : '매매';
  const floorGroupValue = stringValue(raw.floor_group);
  const floorGroup: FloorGroup =
    floorGroupValue === '저층' || floorGroupValue === '중층' || floorGroupValue === '고층' ? floorGroupValue : null;
  const floor = numberValue(raw.floor);
  const totalFloor = numberValue(raw.total_floor);
  const input: ListingInput = {
    complex_id: complex?.id ?? '',
    building_no: stringValue(raw.building_no),
    deal_type: dealType,
    price: numberValue(raw.price),
    deposit: numberValue(raw.deposit),
    monthly_rent: numberValue(raw.monthly_rent),
    supply_area_m2: numberValue(raw.supply_area_m2),
    exclusive_area_m2: numberValue(raw.exclusive_area_m2) ?? 0,
    area_type: stringValue(raw.area_type),
    floor_text: stringValue(raw.floor_text) ?? (floor !== null && totalFloor !== null ? `${floor}/${totalFloor}층` : null),
    floor,
    total_floor: totalFloor,
    floor_group: floorGroup,
    direction: stringValue(raw.direction),
    verified_date: stringValue(raw.verified_date),
    registered_date: stringValue(raw.registered_date),
    agent_name: stringValue(raw.agent_name),
    agent_count: numberValue(raw.agent_count),
    source: stringValue(raw.source) ?? 'JSON 입력',
    description: stringValue(raw.description),
    raw_text: stringValue(raw.raw_text) ?? JSON.stringify(raw),
    is_favorite: false,
    is_duplicate_candidate: false,
  };
  const errors = validateListingInput(input);
  if (!complex) errors.unshift('등록된 단지명 또는 complex_id와 일치하지 않습니다.');
  if (!validDealType) errors.push('deal_type은 매매, 전세, 월세 중 하나여야 합니다.');
  return { input, complexName: complex?.name ?? stringValue(raw.complex_name) ?? '단지 미확인', errors };
}

export function BulkListingInputPage() {
  const { complexes, loading, error, reload } = useAppData();
  const [jsonText, setJsonText] = useState(sampleJson);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handlePreview() {
    setNotice(null);
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('JSON 최상위 값은 배열이어야 합니다.');
      const rows = parsed.map((row) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          throw new Error('각 행은 객체 형태여야 합니다.');
        }
        return convertRow(row as Record<string, unknown>, complexes);
      });
      setPreview(rows);
      setNotice(`${rows.length}건을 파싱했습니다. 오류가 없는 경우 저장할 수 있습니다.`);
    } catch (caught) {
      setPreview([]);
      setNotice(caught instanceof Error ? caught.message : 'JSON을 읽을 수 없습니다.');
    }
  }

  async function handleSave() {
    const invalid = preview.some((row) => row.errors.length > 0);
    if (!preview.length || invalid) {
      setNotice('오류가 있는 행을 수정한 뒤 다시 미리보기 하세요.');
      return;
    }
    setBusy(true);
    try {
      await createListings(preview.map((row) => row.input));
      await reload();
      setNotice(`${preview.length}건의 매물을 저장했습니다. 중복 후보는 저장 시 자동 표시됩니다.`);
      setPreview([]);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : '매물을 저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="매물 일괄 입력" description="정리한 JSON 배열을 붙여넣고 검증한 후 한 번에 저장합니다." />
      <Card>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileJson className="h-5 w-5 text-brand-600" /> JSON 붙여넣기
        </div>
        <textarea
          className="field-control mt-4 min-h-[280px] resize-y font-mono text-xs leading-6"
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          spellCheck={false}
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handlePreview}>
            미리보기 및 검증
          </Button>
          <Button disabled={!preview.length || busy || preview.some((row) => row.errors.length > 0)} onClick={() => void handleSave()}>
            {busy ? '저장 중...' : '일괄 저장'}
          </Button>
        </div>
      </Card>

      {notice && <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{notice}</p>}

      {preview.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">저장 전 미리보기</h2>
          {preview.map((row, index) => (
            <Card key={`${row.complexName}-${index}`} className={row.errors.length ? 'ring-1 ring-red-100' : ''}>
              <div className="flex gap-3">
                {row.errors.length ? (
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate font-semibold">{row.complexName}</p>
                    <p className="metric-number font-bold">{formatPrice(row.input.price ?? row.input.deposit)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {row.input.deal_type} · 전용 {row.input.exclusive_area_m2}㎡ · {row.input.building_no ?? '-'} ·{' '}
                    {row.input.direction ?? '-'}
                  </p>
                  {row.errors.length > 0 && (
                    <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{row.errors.join(' ')}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
