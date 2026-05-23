import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AreaDisplayRule } from '../features/settings/types';
import { DEFAULT_COMPLEX_COLORS, formatDisplayAreaLabel } from '../features/settings/display';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';

function newRule(rules: AreaDisplayRule[]): AreaDisplayRule {
  const start = rules.length ? Math.max(...rules.map((rule) => rule.source_area_pyeong_max)) + 1 : 24;
  return {
    id: `area-${start}`,
    source_area_pyeong_min: start,
    source_area_pyeong_max: start,
    display_area_pyeong: start,
    exclusive_area_m2: Math.round(start * 2.64),
  };
}

function validateRules(rules: AreaDisplayRule[]): string | null {
  if (new Set(rules.map((rule) => rule.id.trim())).size !== rules.length) return '평형 규칙 ID는 중복될 수 없습니다.';
  for (const rule of rules) {
    if (!rule.id.trim()) return '평형 규칙 ID를 입력해 주세요.';
    if (rule.source_area_pyeong_min <= 0 || rule.source_area_pyeong_max <= 0 || rule.display_area_pyeong <= 0 || rule.exclusive_area_m2 <= 0) {
      return '평형 규칙의 숫자는 0보다 커야 합니다.';
    }
    if (rule.source_area_pyeong_min > rule.source_area_pyeong_max) return '원본 공급평 최소값은 최대값보다 클 수 없습니다.';
  }
  const ordered = [...rules].sort((a, b) => a.source_area_pyeong_min - b.source_area_pyeong_min);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].source_area_pyeong_min <= ordered[index - 1].source_area_pyeong_max) {
      return '원본 공급평 범위가 서로 겹치지 않게 설정해 주세요.';
    }
  }
  return null;
}

export function DisplaySettingsPage() {
  const { complexes, displaySettings, loading, error } = useAppData();
  const [colors, setColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(complexes.map((complex) => [complex.id, displaySettings.complex_colors[complex.id] ?? complex.color])),
  );
  const [rules, setRules] = useState<AreaDisplayRule[]>(displaySettings.area_groups);
  const [adminKey, setAdminKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  function updateRule(index: number, field: keyof AreaDisplayRule, value: string) {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index
          ? { ...rule, [field]: field === 'id' ? value : Number(value) }
          : rule,
      ),
    );
  }

  async function saveSettings() {
    const validationError = validateRules(rules);
    if (validationError) {
      setFeedback({ tone: 'error', message: validationError });
      return;
    }
    if (!adminKey.trim()) {
      setFeedback({ tone: 'error', message: '관리자 저장 키를 입력해 주세요.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/complex-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey.trim() },
        body: JSON.stringify({
          operation: 'save_display_settings',
          settings: {
            updated_at: new Date().toISOString().slice(0, 10),
            complex_colors: colors,
            area_groups: rules,
          },
        }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? '표시 설정을 저장하지 못했습니다.');
      setFeedback({ tone: 'success', message: result?.message ?? '표시 설정을 저장했습니다.' });
    } catch (caught) {
      setFeedback({ tone: 'error', message: caught instanceof Error ? caught.message : '표시 설정을 저장하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <Link to="/manage" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> 관리로 돌아가기
      </Link>
      <PageHeader
        title="표시 설정"
        description="단지별 색상과 서로 다른 공급평 표기를 하나의 비교 평형으로 묶습니다. 저장 후 자동 배포가 완료되면 분석 화면 전체에 반영됩니다."
      />

      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-bold">단지별 표현 색상</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">대시보드의 점, 비교 표시, 변화 그래프 선에 동일한 색상이 사용됩니다.</p>
        <div className="mt-5 space-y-5">
          {complexes.map((complex) => (
            <div key={complex.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-slate-700">{complex.name}</p>
                <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
                  직접 선택
                  <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                    value={colors[complex.id] ?? complex.color}
                    onChange={(event) => setColors((current) => ({ ...current, [complex.id]: event.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEFAULT_COMPLEX_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-9 w-9 rounded-full border-2 transition ${colors[complex.id] === color ? 'border-slate-800 ring-2 ring-slate-200' : 'border-white'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setColors((current) => ({ ...current, [complex.id]: color }))}
                    aria-label={`${complex.name} 색상 ${color} 선택`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">평형 그룹 설정</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              원본 JSON의 공급평 범위를 같은 표시 평형으로 묶습니다. 예: 24~26평을 25평 (59㎡)로 표시합니다.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
            onClick={() => setRules((current) => [...current, newRule(current)])}
          >
            <Plus className="h-4 w-4" /> 추가
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {rules.map((rule, index) => (
            <div key={rule.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-slate-700">{formatDisplayAreaLabel(rule)}</strong>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-500"
                  onClick={() => setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))}
                  aria-label="평형 규칙 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="text-[11px] font-semibold text-slate-500">
                  원본 최소평
                  <input className="field-control mt-1" type="number" value={rule.source_area_pyeong_min} onChange={(event) => updateRule(index, 'source_area_pyeong_min', event.target.value)} />
                </label>
                <label className="text-[11px] font-semibold text-slate-500">
                  원본 최대평
                  <input className="field-control mt-1" type="number" value={rule.source_area_pyeong_max} onChange={(event) => updateRule(index, 'source_area_pyeong_max', event.target.value)} />
                </label>
                <label className="text-[11px] font-semibold text-slate-500">
                  표시 평형
                  <input className="field-control mt-1" type="number" value={rule.display_area_pyeong} onChange={(event) => updateRule(index, 'display_area_pyeong', event.target.value)} />
                </label>
                <label className="text-[11px] font-semibold text-slate-500">
                  전용면적 ㎡
                  <input className="field-control mt-1" type="number" value={rule.exclusive_area_m2} onChange={(event) => updateRule(index, 'exclusive_area_m2', event.target.value)} />
                </label>
              </div>
              <label className="mt-3 block text-[11px] font-semibold text-slate-500">
                규칙 ID
                <input className="field-control mt-1" value={rule.id} onChange={(event) => updateRule(index, 'id', event.target.value)} />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <label className="text-sm font-semibold text-slate-700">
          관리자 저장 키
          <input
            type="password"
            className="field-control mt-2"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Cloudflare ADMIN_SAVE_KEY 값"
          />
        </label>
        {feedback && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {feedback.message}
          </p>
        )}
        <button
          type="button"
          className="mt-4 w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          disabled={saving}
          onClick={saveSettings}
        >
          {saving ? '저장 중...' : '표시 설정 저장'}
        </button>
        <p className="mt-3 text-xs leading-5 text-slate-400">저장하면 GitHub 설정 파일이 변경되고 Cloudflare 재배포 후 대시보드, 비교, 변화 탭에 표시 규칙이 반영됩니다.</p>
      </Card>
    </div>
  );
}
