import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createListing } from '../features/listings/api';
import type { DealType, FloorGroup, ListingInput } from '../features/listings/types';
import { validateListingInput } from '../features/listings/validation';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Field } from '../shared/components/Field';
import { PageHeader } from '../shared/components/PageHeader';
import { ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { formatPrice } from '../shared/utils/price';

interface ListingForm {
  complex_id: string;
  building_no: string;
  deal_type: DealType;
  price: string;
  deposit: string;
  monthly_rent: string;
  supply_area_m2: string;
  exclusive_area_m2: string;
  area_type: string;
  floor: string;
  total_floor: string;
  floor_group: FloorGroup;
  direction: string;
  verified_date: string;
  registered_date: string;
  agent_name: string;
  agent_count: string;
  source: string;
  description: string;
  raw_text: string;
  is_favorite: boolean;
}

function initialForm(): ListingForm {
  return {
    complex_id: '',
    building_no: '',
    deal_type: '매매',
    price: '',
    deposit: '',
    monthly_rent: '',
    supply_area_m2: '',
    exclusive_area_m2: '',
    area_type: '',
    floor: '',
    total_floor: '',
    floor_group: null,
    direction: '',
    verified_date: new Date().toISOString().slice(0, 10),
    registered_date: '',
    agent_name: '',
    agent_count: '',
    source: '네이버부동산',
    description: '',
    raw_text: '',
    is_favorite: false,
  };
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}

function toListingInput(form: ListingForm): ListingInput {
  const floor = optionalNumber(form.floor);
  const totalFloor = optionalNumber(form.total_floor);
  return {
    complex_id: form.complex_id,
    building_no: optionalText(form.building_no),
    deal_type: form.deal_type,
    price: optionalNumber(form.price),
    deposit: optionalNumber(form.deposit),
    monthly_rent: optionalNumber(form.monthly_rent),
    supply_area_m2: optionalNumber(form.supply_area_m2),
    exclusive_area_m2: optionalNumber(form.exclusive_area_m2) ?? 0,
    area_type: optionalText(form.area_type),
    floor_text: floor !== null && totalFloor !== null ? `${floor}/${totalFloor}층` : null,
    floor,
    total_floor: totalFloor,
    floor_group: form.floor_group,
    direction: optionalText(form.direction),
    verified_date: optionalText(form.verified_date),
    registered_date: optionalText(form.registered_date),
    agent_name: optionalText(form.agent_name),
    agent_count: optionalNumber(form.agent_count),
    source: optionalText(form.source),
    description: optionalText(form.description),
    raw_text: optionalText(form.raw_text),
    is_favorite: form.is_favorite,
    is_duplicate_candidate: false,
  };
}

export function ListingInputPage() {
  const { complexes, loading, error, reload } = useAppData();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<ListingForm>(() => ({
    ...initialForm(),
    complex_id: searchParams.get('complexId') ?? '',
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = toListingInput(form);
    const nextErrors = validateListingInput(input);
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await createListing(input);
      await reload();
      navigate(`/complexes/${input.complex_id}`);
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : '매물을 저장하지 못했습니다.']);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="매물 등록" description="직접 확인한 호가를 입력합니다. 필수값은 단지, 거래 유형, 가격, 전용면적입니다." />

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="단지 *">
              <select
                className="field-control"
                value={form.complex_id}
                onChange={(event) => setForm({ ...form, complex_id: event.target.value })}
              >
                <option value="">단지를 선택하세요</option>
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="거래유형 *">
              <select
                className="field-control"
                value={form.deal_type}
                onChange={(event) => setForm({ ...form, deal_type: event.target.value as DealType })}
              >
                <option value="매매">매매</option>
                <option value="전세">전세</option>
                <option value="월세">월세</option>
              </select>
            </Field>
            <Field label={form.deal_type === '전세' ? '전세 가격' : '가격'} description="원 단위 입력">
              <input
                className="field-control"
                inputMode="numeric"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="830000000"
              />
              {optionalNumber(form.price) !== null && (
                <span className="mt-2 block text-xs font-semibold text-brand-600">{formatPrice(optionalNumber(form.price))}</span>
              )}
            </Field>
            {(form.deal_type === '전세' || form.deal_type === '월세') && (
              <Field label="보증금" description="원 단위 입력">
                <input
                  className="field-control"
                  inputMode="numeric"
                  value={form.deposit}
                  onChange={(event) => setForm({ ...form, deposit: event.target.value })}
                />
              </Field>
            )}
            {form.deal_type === '월세' && (
              <Field label="월세" description="원 단위 입력">
                <input
                  className="field-control"
                  inputMode="numeric"
                  value={form.monthly_rent}
                  onChange={(event) => setForm({ ...form, monthly_rent: event.target.value })}
                />
              </Field>
            )}
            <Field label="전용면적 *" description="㎡">
              <input
                type="number"
                step="0.01"
                className="field-control"
                value={form.exclusive_area_m2}
                onChange={(event) => setForm({ ...form, exclusive_area_m2: event.target.value })}
                placeholder="84"
              />
            </Field>
            <Field label="공급면적 / 타입" description="선택">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="field-control"
                  value={form.supply_area_m2}
                  onChange={(event) => setForm({ ...form, supply_area_m2: event.target.value })}
                  placeholder="공급 112"
                />
                <input
                  className="field-control"
                  value={form.area_type}
                  onChange={(event) => setForm({ ...form, area_type: event.target.value })}
                  placeholder="84A"
                />
              </div>
            </Field>
            <Field label="동">
              <input
                className="field-control"
                value={form.building_no}
                onChange={(event) => setForm({ ...form, building_no: event.target.value })}
                placeholder="108동"
              />
            </Field>
            <Field label="층 / 전체층">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="field-control"
                  value={form.floor}
                  onChange={(event) => setForm({ ...form, floor: event.target.value })}
                  placeholder="층"
                />
                <input
                  type="number"
                  className="field-control"
                  value={form.total_floor}
                  onChange={(event) => setForm({ ...form, total_floor: event.target.value })}
                  placeholder="전체층"
                />
              </div>
            </Field>
            <Field label="층구분 / 방향">
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="field-control"
                  value={form.floor_group ?? ''}
                  onChange={(event) => setForm({ ...form, floor_group: (event.target.value || null) as FloorGroup })}
                >
                  <option value="">선택</option>
                  <option value="저층">저층</option>
                  <option value="중층">중층</option>
                  <option value="고층">고층</option>
                </select>
                <input
                  className="field-control"
                  value={form.direction}
                  onChange={(event) => setForm({ ...form, direction: event.target.value })}
                  placeholder="남동향"
                />
              </div>
            </Field>
            <Field label="확인일 / 등록일">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="field-control"
                  value={form.verified_date}
                  onChange={(event) => setForm({ ...form, verified_date: event.target.value })}
                />
                <input
                  type="date"
                  className="field-control"
                  value={form.registered_date}
                  onChange={(event) => setForm({ ...form, registered_date: event.target.value })}
                />
              </div>
            </Field>
            <Field label="출처 / 중개사 / 노출 중개사 수">
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="field-control"
                  value={form.source}
                  onChange={(event) => setForm({ ...form, source: event.target.value })}
                />
                <input
                  className="field-control"
                  value={form.agent_name}
                  onChange={(event) => setForm({ ...form, agent_name: event.target.value })}
                  placeholder="중개사명"
                />
                <input
                  type="number"
                  className="field-control"
                  value={form.agent_count}
                  onChange={(event) => setForm({ ...form, agent_count: event.target.value })}
                  placeholder="중개사 수"
                />
              </div>
            </Field>
          </div>
          <Field label="매물 설명">
            <textarea
              rows={3}
              className="field-control resize-none"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="원문 텍스트">
            <textarea
              rows={3}
              className="field-control resize-none"
              value={form.raw_text}
              onChange={(event) => setForm({ ...form, raw_text: event.target.value })}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-500"
              checked={form.is_favorite}
              onChange={(event) => setForm({ ...form, is_favorite: event.target.checked })}
            />
            관심 매물로 표시
          </label>
          <Button type="submit" fullWidth disabled={busy || !complexes.length}>
            {busy ? '저장 중...' : '매물 저장'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
