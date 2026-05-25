import { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ComplexGuide } from '../features/guides/types';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { ErrorState } from '../shared/components/States';
import { loadComplexGuides, parseComplexGuide } from '../features/guides/data';

const GUIDE_COMPLEX_ID = 'hwaseo-prugio-edu';

export function GuideEditorPage() {
  let guides: ComplexGuide[] = [];
  let loadError: string | null = null;
  try {
    guides = loadComplexGuides();
  } catch (caught) {
    loadError = caught instanceof Error ? caught.message : '우리 단지 가이드를 불러오지 못했습니다.';
  }
  const existingGuide = guides.find((guide) => guide.complex_id === GUIDE_COMPLEX_ID) ?? guides[0];
  const [jsonText, setJsonText] = useState(() => existingGuide ? JSON.stringify(existingGuide, null, 2) : '');
  const [adminKey, setAdminKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const preview = useMemo(() => {
    try {
      return parseComplexGuide(JSON.parse(jsonText), '가이드 입력 JSON');
    } catch {
      return null;
    }
  }, [jsonText]);

  if (loadError) return <ErrorState message={loadError} />;
  if (!existingGuide) return <ErrorState message="편집할 우리 단지 가이드 JSON이 없습니다." />;

  async function saveGuide() {
    let parsed: ComplexGuide;
    try {
      parsed = parseComplexGuide(JSON.parse(jsonText), '가이드 입력 JSON');
    } catch (caught) {
      setFeedback({ tone: 'error', message: caught instanceof Error ? caught.message : '가이드 JSON을 확인해 주세요.' });
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
        body: JSON.stringify({ operation: 'save_complex_guide', guide: parsed }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? '우리 단지 가이드를 저장하지 못했습니다.');
      setFeedback({ tone: 'success', message: result?.message ?? '우리 단지 가이드를 저장했습니다.' });
    } catch (caught) {
      setFeedback({ tone: 'error', message: caught instanceof Error ? caught.message : '우리 단지 가이드를 저장하지 못했습니다.' });
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
        title="우리 단지 가이드 편집"
        description="생활 안내, 시설 설명, 배치도 이미지 URL, 동별 설명과 주변 시설 링크를 JSON으로 수정합니다."
        action={
          <Link to="/guide" className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-card">
            화면 보기 <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <Card className="p-4 sm:p-6">
        <h2 className="text-sm font-bold">편집 항목 안내</h2>
        <div className="mt-3 space-y-1 text-xs leading-5 text-slate-500">
          <p>`site_map.image_url`에 배치도 이미지의 공개 URL을 넣으면 가이드 화면에 표시됩니다.</p>
          <p>`building_notes`에 동별 제목, 설명, 태그를 추가하면 동별 안내 카드가 생성됩니다.</p>
          <p>`facilities`, `nearby_places`, `faqs`는 배열 항목을 추가하거나 수정할 수 있습니다.</p>
          <p>`nearby_places`에 `map_url`을 추가하면 공식 정보 링크와 지도 링크를 나누어 표시합니다.</p>
          <p>공동현관 비밀번호나 입주민 개인정보 등 보안 정보는 입력하지 마세요.</p>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">가이드 JSON</h2>
          {preview && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">JSON 정상</span>}
        </div>
        <textarea
          className="mt-4 min-h-[34rem] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-brand-500"
          value={jsonText}
          onChange={(event) => {
            setJsonText(event.target.value);
            setFeedback(null);
          }}
          spellCheck={false}
        />
        {preview && (
          <p className="mt-3 text-xs text-slate-500">
            시설 {preview.facilities.length}개 · 주변 생활 {preview.nearby_places.length}개 · FAQ {preview.faqs.length}개 · 동별 안내 {preview.building_notes.length}개
          </p>
        )}
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
        <Button type="button" className="mt-4" fullWidth disabled={saving} onClick={saveGuide}>
          {saving ? '저장 중...' : '우리 단지 가이드 저장'}
        </Button>
        <p className="mt-3 text-xs leading-5 text-slate-400">저장하면 GitHub 가이드 JSON이 변경되고 Cloudflare 재배포 후 공개 탭에 반영됩니다.</p>
      </Card>
    </div>
  );
}
