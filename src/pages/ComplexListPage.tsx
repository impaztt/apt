import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { createComplex, deleteComplex, updateComplex } from '../features/complexes/api';
import type { ApartmentComplex, ComplexInput } from '../features/complexes/types';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Field } from '../shared/components/Field';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';

const emptyInput: ComplexInput = {
  name: '',
  region: null,
  address: null,
  legal_dong_code: null,
  built_year: null,
  household_count: null,
  parking_count: null,
  floor_area_ratio: null,
  building_coverage_ratio: null,
  builder: null,
  brand: null,
  transit_note: null,
  school_note: null,
  infrastructure_note: null,
  memo: null,
};

function textOrNull(value: string): string | null {
  return value.trim() || null;
}

function numberOrNull(value: string): number | null {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) ? parsed : null;
}

function toComplexInput(complex: ApartmentComplex): ComplexInput {
  return {
    name: complex.name,
    region: complex.region,
    address: complex.address,
    legal_dong_code: complex.legal_dong_code,
    built_year: complex.built_year,
    household_count: complex.household_count,
    parking_count: complex.parking_count,
    floor_area_ratio: complex.floor_area_ratio,
    building_coverage_ratio: complex.building_coverage_ratio,
    builder: complex.builder,
    brand: complex.brand,
    transit_note: complex.transit_note,
    school_note: complex.school_note,
    infrastructure_note: complex.infrastructure_note,
    memo: complex.memo,
  };
}

export function ComplexListPage() {
  const { complexes, listings, loading, error, reload } = useAppData();
  const [form, setForm] = useState<ComplexInput>(emptyInput);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function startEdit(complex: ApartmentComplex) {
    setForm(toComplexInput(complex));
    setEditingId(complex.id);
    setFormOpen(true);
    setMessage(null);
  }

  function resetForm() {
    setForm(emptyInput);
    setEditingId(null);
    setFormOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage('단지명은 필수입니다.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (editingId) {
        await updateComplex(editingId, form);
        setMessage('단지 정보를 수정했습니다.');
      } else {
        await createComplex(form);
        setMessage('단지를 등록했습니다.');
      }
      resetForm();
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : '단지를 저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(complex: ApartmentComplex) {
    if (!window.confirm(`'${complex.name}' 단지와 연결된 매물을 삭제하시겠습니까?`)) return;
    try {
      await deleteComplex(complex.id);
      await reload();
      setMessage('단지를 삭제했습니다.');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : '단지를 삭제하지 못했습니다.');
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="단지 관리"
        description="비교 대상 단지의 기본 정보와 법정동 코드를 관리합니다."
        action={
          <Button
            onClick={() => {
              setForm(emptyInput);
              setEditingId(null);
              setFormOpen((value) => !value);
            }}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> 단지 등록
            </span>
          </Button>
        }
      />

      {message && <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{message}</p>}

      {formOpen && (
        <Card>
          <h2 className="text-lg font-bold">{editingId ? '단지 정보 수정' : '새 단지 등록'}</h2>
          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="단지명 *">
                <input
                  className="field-control"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="화서역푸르지오더에듀포레"
                />
              </Field>
              <Field label="지역명">
                <input
                  className="field-control"
                  value={form.region ?? ''}
                  onChange={(event) => setForm({ ...form, region: textOrNull(event.target.value) })}
                  placeholder="수원시 장안구 정자동"
                />
              </Field>
              <Field label="주소">
                <input
                  className="field-control"
                  value={form.address ?? ''}
                  onChange={(event) => setForm({ ...form, address: textOrNull(event.target.value) })}
                />
              </Field>
              <Field label="법정동 코드" description="실거래가 연동용">
                <input
                  className="field-control"
                  value={form.legal_dong_code ?? ''}
                  onChange={(event) => setForm({ ...form, legal_dong_code: textOrNull(event.target.value) })}
                />
              </Field>
              <Field label="준공년도">
                <input
                  type="number"
                  className="field-control"
                  value={form.built_year ?? ''}
                  onChange={(event) => setForm({ ...form, built_year: numberOrNull(event.target.value) })}
                />
              </Field>
              <Field label="세대수">
                <input
                  type="number"
                  className="field-control"
                  value={form.household_count ?? ''}
                  onChange={(event) => setForm({ ...form, household_count: numberOrNull(event.target.value) })}
                />
              </Field>
              <Field label="주차대수">
                <input
                  type="number"
                  className="field-control"
                  value={form.parking_count ?? ''}
                  onChange={(event) => setForm({ ...form, parking_count: numberOrNull(event.target.value) })}
                />
              </Field>
              <Field label="브랜드 / 시공사">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="field-control"
                    value={form.brand ?? ''}
                    onChange={(event) => setForm({ ...form, brand: textOrNull(event.target.value) })}
                    placeholder="브랜드"
                  />
                  <input
                    className="field-control"
                    value={form.builder ?? ''}
                    onChange={(event) => setForm({ ...form, builder: textOrNull(event.target.value) })}
                    placeholder="시공사"
                  />
                </div>
              </Field>
              <Field label="용적률 / 건폐율">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="field-control"
                    value={form.floor_area_ratio ?? ''}
                    onChange={(event) => setForm({ ...form, floor_area_ratio: numberOrNull(event.target.value) })}
                    placeholder="용적률"
                  />
                  <input
                    type="number"
                    className="field-control"
                    value={form.building_coverage_ratio ?? ''}
                    onChange={(event) => setForm({ ...form, building_coverage_ratio: numberOrNull(event.target.value) })}
                    placeholder="건폐율"
                  />
                </div>
              </Field>
              <Field label="교통 메모">
                <input
                  className="field-control"
                  value={form.transit_note ?? ''}
                  onChange={(event) => setForm({ ...form, transit_note: textOrNull(event.target.value) })}
                />
              </Field>
              <Field label="학군 메모">
                <input
                  className="field-control"
                  value={form.school_note ?? ''}
                  onChange={(event) => setForm({ ...form, school_note: textOrNull(event.target.value) })}
                />
              </Field>
              <Field label="생활 인프라 메모">
                <input
                  className="field-control"
                  value={form.infrastructure_note ?? ''}
                  onChange={(event) => setForm({ ...form, infrastructure_note: textOrNull(event.target.value) })}
                />
              </Field>
            </div>
            <Field label="비고">
              <textarea
                rows={3}
                className="field-control resize-none"
                value={form.memo ?? ''}
                onChange={(event) => setForm({ ...form, memo: textOrNull(event.target.value) })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                취소
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? '저장 중...' : editingId ? '수정 저장' : '단지 저장'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {complexes.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {complexes.map((complex) => {
            const count = listings.filter((listing) => listing.complex_id === complex.id).length;
            return (
              <Card key={complex.id}>
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/complexes/${complex.id}`} className="min-w-0">
                    <p className="truncate font-bold">{complex.name}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {complex.region ?? '지역 미입력'} · {complex.built_year ? `${complex.built_year}년 준공` : '준공년도 미입력'}
                    </p>
                  </Link>
                  <Building2 className="h-5 w-5 shrink-0 text-slate-300" />
                </div>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="rounded-full bg-slate-50 px-3 py-1.5 text-slate-600">매물 {count}건</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-ink"
                      onClick={() => startEdit(complex)}
                      aria-label="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => void handleDelete(complex)}
                      aria-label="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="등록된 단지가 없습니다" description="단지를 등록한 뒤 매물 입력과 비교 그룹 설정을 시작하세요." />
      )}
    </div>
  );
}
