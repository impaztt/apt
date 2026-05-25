import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  ComplexGuide,
  GuideBuildingNote,
  GuideChecklistSection,
  GuideContentCard,
  GuideExternalLink,
  GuideFacility,
  GuideFaq,
  GuideNearbyPlace,
  GuideOverviewItem,
  GuideSource,
} from '../features/guides/types';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { ErrorState } from '../shared/components/States';
import { loadComplexGuides, parseComplexGuide } from '../features/guides/data';

const GUIDE_COMPLEX_ID = 'hwaseo-prugio-edu';
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

type Feedback = { tone: 'success' | 'error'; message: string };
type TextListCard = GuideChecklistSection | GuideContentCard;

function cloneGuide(guide: ComplexGuide): ComplexGuide {
  return JSON.parse(JSON.stringify(guide)) as ComplexGuide;
}

function replaceAt<T>(items: T[], index: number, next: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item));
}

function linesToItems(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function managedImageAsset(url: string | null): string | null {
  if (!url) return null;
  const cleanUrl = url.split('?')[0];
  return /^\/guides\/[a-z0-9-]+\/site-map\.(jpg|png|webp)$/.test(cleanUrl) ? cleanUrl : null;
}

function SectionCard({
  id,
  title,
  description,
  addLabel,
  onAdd,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  addLabel?: string;
  onAdd?: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-28 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        {onAdd && (
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700"
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" /> {addLabel ?? '추가'}
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500">
      {label}
      {multiline ? (
        <textarea
          className="field-control mt-1 min-h-20 resize-y"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="field-control mt-1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function ItemBox({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
      <div className="flex justify-end">
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-500" onClick={onRemove} aria-label="항목 삭제">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="-mt-7 space-y-2 pr-9">{children}</div>
    </div>
  );
}

function TextListSection({
  id,
  title,
  description,
  items,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  items: TextListCard[];
  onChange: (items: TextListCard[]) => void;
}) {
  return (
    <SectionCard
      id={id}
      title={title}
      description={description}
      addLabel="카드 추가"
      onAdd={() => onChange([...items, { title: '', description: '', items: [] }])}
    >
      {items.map((item, index) => (
        <ItemBox key={`${title}-${index}`} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
          <Field label="제목" value={item.title} onChange={(value) => onChange(replaceAt(items, index, { ...item, title: value }))} />
          <Field label="짧은 설명" value={item.description} onChange={(value) => onChange(replaceAt(items, index, { ...item, description: value }))} />
          <Field
            label="상세 안내 - 한 줄에 한 항목"
            multiline
            value={item.items.join('\n')}
            onChange={(value) => onChange(replaceAt(items, index, { ...item, items: linesToItems(value) }))}
          />
        </ItemBox>
      ))}
      {!items.length && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">표시할 카드가 없습니다. 추가 버튼으로 등록하세요.</p>}
    </SectionCard>
  );
}

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(new Error('이미지 파일을 읽지 못했습니다.')));
    reader.readAsDataURL(file);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

async function postAdminRequest(adminKey: string, body: object): Promise<{ message?: string; imageUrl?: string }> {
  const response = await fetch('/api/complex-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey.trim() },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null) as { message?: string; imageUrl?: string } | null;
  if (!response.ok) throw new Error(result?.message ?? '저장 요청을 처리하지 못했습니다.');
  return result ?? {};
}

export function GuideEditorPage() {
  let guides: ComplexGuide[] = [];
  let loadError: string | null = null;
  try {
    guides = loadComplexGuides();
  } catch (caught) {
    loadError = caught instanceof Error ? caught.message : '우리 단지 가이드를 불러오지 못했습니다.';
  }
  const existingGuide = guides.find((guide) => guide.complex_id === GUIDE_COMPLEX_ID) ?? guides[0];
  const [draft, setDraft] = useState<ComplexGuide | null>(() => existingGuide ? cloneGuide(existingGuide) : null);
  const [publishedImageUrl, setPublishedImageUrl] = useState<string | null>(() => existingGuide?.site_map.image_url ?? null);
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(() => existingGuide?.site_map.image_url ?? null);
  const [pendingMapFile, setPendingMapFile] = useState<File | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [advancedJson, setAdvancedJson] = useState(() => existingGuide ? JSON.stringify(existingGuide, null, 2) : '');

  const validationError = useMemo(() => {
    if (!draft) return '편집할 가이드가 없습니다.';
    try {
      parseComplexGuide(draft, '가이드 입력 정보');
      return null;
    } catch (caught) {
      return caught instanceof Error ? caught.message : '가이드 입력 내용을 확인해 주세요.';
    }
  }, [draft]);

  if (loadError) return <ErrorState message={loadError} />;
  if (!existingGuide || !draft) return <ErrorState message="편집할 우리 단지 가이드 JSON이 없습니다." />;

  function changeDraft(updater: (current: ComplexGuide) => ComplexGuide) {
    setDraft((current) => current ? updater(current) : current);
    setFeedback(null);
  }

  function selectMapImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback({ tone: 'error', message: '단지 지도 이미지는 JPG, PNG, WEBP 파일만 선택할 수 있습니다.' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFeedback({ tone: 'error', message: '단지 지도 이미지는 4MB 이하로 선택해 주세요.' });
      return;
    }
    if (mapPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(mapPreviewUrl);
    setPendingMapFile(file);
    setMapPreviewUrl(URL.createObjectURL(file));
    setFeedback({ tone: 'success', message: '새 이미지를 선택했습니다. 아래 저장 버튼을 누르면 공개 화면에 반영됩니다.' });
  }

  function removeMapImage() {
    if (mapPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(mapPreviewUrl);
    setPendingMapFile(null);
    setMapPreviewUrl(null);
    changeDraft((current) => ({ ...current, site_map: { ...current.site_map, image_url: null } }));
  }

  async function saveGuide() {
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
      let guideToSave = parseComplexGuide(
        { ...draft, updated_at: new Date().toISOString().slice(0, 10) },
        '가이드 입력 정보',
      );
      if (pendingMapFile) {
        const imageResult = await postAdminRequest(adminKey, {
          operation: 'save_guide_image',
          complex_id: guideToSave.complex_id,
          content_type: pendingMapFile.type,
          content_base64: await fileToBase64(pendingMapFile),
        });
        if (!imageResult.imageUrl) throw new Error('업로드한 이미지 주소를 받지 못했습니다.');
        guideToSave = { ...guideToSave, site_map: { ...guideToSave.site_map, image_url: imageResult.imageUrl } };
      }

      const result = await postAdminRequest(adminKey, { operation: 'save_complex_guide', guide: guideToSave });
      const previousAsset = managedImageAsset(publishedImageUrl);
      const nextAsset = managedImageAsset(guideToSave.site_map.image_url);
      let cleanupNotice = '';
      if (previousAsset && previousAsset !== nextAsset) {
        try {
          await postAdminRequest(adminKey, {
            operation: 'delete_guide_image',
            complex_id: guideToSave.complex_id,
            image_url: publishedImageUrl,
          });
        } catch {
          cleanupNotice = ' 기존 이미지 파일 정리는 실패했지만 공개 화면에서는 제거됩니다.';
        }
      }

      setDraft(guideToSave);
      setPublishedImageUrl(guideToSave.site_map.image_url);
      setPendingMapFile(null);
      setMapPreviewUrl(guideToSave.site_map.image_url);
      setAdvancedJson(JSON.stringify(guideToSave, null, 2));
      setFeedback({ tone: 'success', message: `${result.message ?? '우리 단지 가이드를 저장했습니다.'}${cleanupNotice}` });
    } catch (caught) {
      setFeedback({ tone: 'error', message: caught instanceof Error ? caught.message : '우리 단지 가이드를 저장하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  function applyAdvancedJson() {
    try {
      const parsed = parseComplexGuide(JSON.parse(advancedJson), '고급 JSON 입력');
      setDraft(parsed);
      setPendingMapFile(null);
      setMapPreviewUrl(parsed.site_map.image_url);
      setFeedback({ tone: 'success', message: 'JSON 내용을 폼에 적용했습니다. 공개 반영을 위해 저장 버튼을 눌러 주세요.' });
    } catch (caught) {
      setFeedback({ tone: 'error', message: caught instanceof Error ? caught.message : 'JSON 내용을 확인해 주세요.' });
    }
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <Link to="/manage" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> 관리로 돌아가기
      </Link>
      <PageHeader
        title="우리 단지 콘텐츠 관리"
        description="공개 탭의 안내 문구, 시설, 지도 이미지, 주변 생활과 FAQ를 항목별로 관리합니다. 저장 후 자동 배포가 끝나면 화면에 반영됩니다."
        action={
          <Link to="/guide" className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-card">
            화면 보기 <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          {[
            ['기본 정보', 'guide-basic'],
            ['입주 준비', 'guide-move-in'],
            ['생활 안내', 'guide-living'],
            ['시설', 'guide-facilities'],
            ['단지 지도', 'guide-map'],
            ['주변 생활', 'guide-nearby'],
            ['FAQ', 'guide-faq'],
          ].map(([label, id]) => (
            <a key={id} href={`#${id}`} className="rounded-full bg-slate-50 px-3 py-2">{label}</a>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
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
        {validationError && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{validationError}</p>}
        <Button type="button" className="mt-4 inline-flex w-full items-center justify-center gap-1" disabled={saving} onClick={saveGuide}>
          <Save className="h-4 w-4" /> {saving ? '저장 중...' : '우리 단지 화면 저장'}
        </Button>
      </Card>

      <SectionCard id="guide-basic" title="기본 정보" description="상단 연락처와 단지 한눈에 카드에 표시되는 정보입니다.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="단지명" value={draft.title} onChange={(value) => changeDraft((current) => ({ ...current, title: value }))} />
          <Field label="주소" value={draft.contact.address} onChange={(value) => changeDraft((current) => ({ ...current, contact: { ...current.contact, address: value } }))} />
          <Field label="관리사무소 전화" value={draft.contact.office_phone} onChange={(value) => changeDraft((current) => ({ ...current, contact: { ...current.contact, office_phone: value } }))} />
          <Field label="공식 홈페이지 URL" value={draft.contact.homepage_url} onChange={(value) => changeDraft((current) => ({ ...current, contact: { ...current.contact, homepage_url: value } }))} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">단지 요약 정보</p>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700" onClick={() => changeDraft((current) => ({ ...current, overview: [...current.overview, { label: '', value: '' }] }))}>
            <Plus className="h-3.5 w-3.5" /> 추가
          </button>
        </div>
        {draft.overview.map((item: GuideOverviewItem, index) => (
          <ItemBox key={`overview-${index}`} onRemove={() => changeDraft((current) => ({ ...current, overview: current.overview.filter((_, itemIndex) => itemIndex !== index) }))}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="항목명" value={item.label} onChange={(value) => changeDraft((current) => ({ ...current, overview: replaceAt(current.overview, index, { ...item, label: value }) }))} />
              <Field label="표시값" value={item.value} onChange={(value) => changeDraft((current) => ({ ...current, overview: replaceAt(current.overview, index, { ...item, value }) }))} />
            </div>
          </ItemBox>
        ))}
      </SectionCard>

      <TextListSection
        id="guide-move-in"
        title="입주 준비"
        description="이사 전, 이사 당일, 입주 후 등 단계별 안내 카드를 관리합니다."
        items={draft.move_in_sections}
        onChange={(items) => changeDraft((current) => ({ ...current, move_in_sections: items as GuideChecklistSection[] }))}
      />
      <TextListSection
        id="guide-living"
        title="생활 안내"
        description="관리비, 주차, 민원 등 생활 안내 카드를 관리합니다."
        items={draft.living_guides}
        onChange={(items) => changeDraft((current) => ({ ...current, living_guides: items as GuideContentCard[] }))}
      />

      <SectionCard
        id="guide-facilities"
        title="시설"
        description="단지 안의 관리·커뮤니티·가족 시설 카드를 관리합니다."
        onAdd={() => changeDraft((current) => ({ ...current, facilities: [...current.facilities, { name: '', category: '', description: '', location: null, hours: null }] }))}
      >
        {draft.facilities.map((facility: GuideFacility, index) => (
          <ItemBox key={`facility-${index}`} onRemove={() => changeDraft((current) => ({ ...current, facilities: current.facilities.filter((_, itemIndex) => itemIndex !== index) }))}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="시설명" value={facility.name} onChange={(value) => changeDraft((current) => ({ ...current, facilities: replaceAt(current.facilities, index, { ...facility, name: value }) }))} />
              <Field label="분류" value={facility.category} onChange={(value) => changeDraft((current) => ({ ...current, facilities: replaceAt(current.facilities, index, { ...facility, category: value }) }))} />
              <Field label="위치" value={facility.location ?? ''} onChange={(value) => changeDraft((current) => ({ ...current, facilities: replaceAt(current.facilities, index, { ...facility, location: value || null }) }))} />
              <Field label="운영시간" value={facility.hours ?? ''} onChange={(value) => changeDraft((current) => ({ ...current, facilities: replaceAt(current.facilities, index, { ...facility, hours: value || null }) }))} />
            </div>
            <Field label="설명" multiline value={facility.description} onChange={(value) => changeDraft((current) => ({ ...current, facilities: replaceAt(current.facilities, index, { ...facility, description: value }) }))} />
          </ItemBox>
        ))}
      </SectionCard>

      <SectionCard id="guide-map" title="단지 지도" description="배치도 이미지를 직접 선택해 업로드하거나 외부 이미지 URL을 입력할 수 있습니다. JPG, PNG, WEBP 파일은 4MB 이하만 저장됩니다.">
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
          이미지 선택 후 화면 저장을 누르면 `public/guides/{draft.complex_id}/site-map.*` 경로에 저장됩니다.
        </p>
        {mapPreviewUrl ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <img src={mapPreviewUrl} alt="단지 지도 미리보기" className="max-h-[32rem] w-full object-contain" />
          </div>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <ImagePlus className="h-7 w-7 text-slate-300" />
            <p className="mt-2 text-xs text-slate-400">등록된 단지 지도 이미지가 없습니다.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
            <ImagePlus className="h-3.5 w-3.5" /> 이미지 선택
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectMapImage} />
          </label>
          {mapPreviewUrl && (
            <button type="button" className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600" onClick={removeMapImage}>
              <Trash2 className="h-3.5 w-3.5" /> 이미지 제거
            </button>
          )}
        </div>
        {pendingMapFile && <p className="text-xs font-medium text-brand-700">선택 파일: {pendingMapFile.name} - 화면 저장 시 GitHub에 업로드됩니다.</p>}
        <Field
          label="외부 이미지 URL - 파일을 선택하지 않는 경우 사용"
          value={pendingMapFile ? '' : (draft.site_map.image_url ?? '')}
          placeholder="https://... 또는 /guides/... 경로"
          onChange={(value) => {
            setPendingMapFile(null);
            setMapPreviewUrl(value || null);
            changeDraft((current) => ({ ...current, site_map: { ...current.site_map, image_url: value || null } }));
          }}
        />
        <Field label="지도 설명" multiline value={draft.site_map.caption} onChange={(value) => changeDraft((current) => ({ ...current, site_map: { ...current.site_map, caption: value } }))} />
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-bold text-slate-700">연결 링크</p>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700" onClick={() => changeDraft((current) => ({ ...current, site_map: { ...current.site_map, links: [...current.site_map.links, { label: '', url: '' }] } }))}>
            <Plus className="h-3.5 w-3.5" /> 링크 추가
          </button>
        </div>
        {draft.site_map.links.map((link: GuideExternalLink, index) => (
          <ItemBox key={`map-link-${index}`} onRemove={() => changeDraft((current) => ({ ...current, site_map: { ...current.site_map, links: current.site_map.links.filter((_, itemIndex) => itemIndex !== index) } }))}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="링크명" value={link.label} onChange={(value) => changeDraft((current) => ({ ...current, site_map: { ...current.site_map, links: replaceAt(current.site_map.links, index, { ...link, label: value }) } }))} />
              <Field label="URL" value={link.url} onChange={(value) => changeDraft((current) => ({ ...current, site_map: { ...current.site_map, links: replaceAt(current.site_map.links, index, { ...link, url: value }) } }))} />
            </div>
          </ItemBox>
        ))}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-bold text-slate-700">동별 안내</p>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700" onClick={() => changeDraft((current) => ({ ...current, building_notes: [...current.building_notes, { building_no: '', title: '', description: '', tags: [] }] }))}>
            <Plus className="h-3.5 w-3.5" /> 동 추가
          </button>
        </div>
        {draft.building_notes.map((building: GuideBuildingNote, index) => (
          <ItemBox key={`building-${index}`} onRemove={() => changeDraft((current) => ({ ...current, building_notes: current.building_notes.filter((_, itemIndex) => itemIndex !== index) }))}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="동" value={building.building_no} onChange={(value) => changeDraft((current) => ({ ...current, building_notes: replaceAt(current.building_notes, index, { ...building, building_no: value }) }))} />
              <Field label="안내 제목" value={building.title} onChange={(value) => changeDraft((current) => ({ ...current, building_notes: replaceAt(current.building_notes, index, { ...building, title: value }) }))} />
            </div>
            <Field label="설명" multiline value={building.description} onChange={(value) => changeDraft((current) => ({ ...current, building_notes: replaceAt(current.building_notes, index, { ...building, description: value }) }))} />
            <Field label="태그 - 쉼표로 구분" value={building.tags.join(', ')} onChange={(value) => changeDraft((current) => ({ ...current, building_notes: replaceAt(current.building_notes, index, { ...building, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) }) }))} />
          </ItemBox>
        ))}
      </SectionCard>

      <SectionCard
        id="guide-nearby"
        title="주변 생활"
        description="교통, 쇼핑, 자연, 문화, 행정 시설을 추가하고 공식 정보와 지도 링크를 관리합니다."
        onAdd={() => changeDraft((current) => ({ ...current, nearby_places: [...current.nearby_places, { name: '', category: '', description: '', url: '' }] }))}
      >
        {draft.nearby_places.map((place: GuideNearbyPlace, index) => (
          <ItemBox key={`nearby-${index}`} onRemove={() => changeDraft((current) => ({ ...current, nearby_places: current.nearby_places.filter((_, itemIndex) => itemIndex !== index) }))}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="장소명" value={place.name} onChange={(value) => changeDraft((current) => ({ ...current, nearby_places: replaceAt(current.nearby_places, index, { ...place, name: value }) }))} />
              <Field label="분류" value={place.category} onChange={(value) => changeDraft((current) => ({ ...current, nearby_places: replaceAt(current.nearby_places, index, { ...place, category: value }) }))} />
            </div>
            <Field label="설명" multiline value={place.description} onChange={(value) => changeDraft((current) => ({ ...current, nearby_places: replaceAt(current.nearby_places, index, { ...place, description: value }) }))} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="정보 또는 기본 지도 URL" value={place.url} onChange={(value) => changeDraft((current) => ({ ...current, nearby_places: replaceAt(current.nearby_places, index, { ...place, url: value }) }))} />
              <Field label="추가 지도 URL (선택)" value={place.map_url ?? ''} onChange={(value) => changeDraft((current) => ({ ...current, nearby_places: replaceAt(current.nearby_places, index, { ...place, map_url: value || undefined }) }))} />
            </div>
          </ItemBox>
        ))}
      </SectionCard>

      <SectionCard
        id="guide-faq"
        title="FAQ"
        description="입주민이 반복적으로 확인할 질문과 답변을 관리합니다."
        onAdd={() => changeDraft((current) => ({ ...current, faqs: [...current.faqs, { question: '', answer: '' }] }))}
      >
        {draft.faqs.map((faq: GuideFaq, index) => (
          <ItemBox key={`faq-${index}`} onRemove={() => changeDraft((current) => ({ ...current, faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index) }))}>
            <Field label="질문" value={faq.question} onChange={(value) => changeDraft((current) => ({ ...current, faqs: replaceAt(current.faqs, index, { ...faq, question: value }) }))} />
            <Field label="답변" multiline value={faq.answer} onChange={(value) => changeDraft((current) => ({ ...current, faqs: replaceAt(current.faqs, index, { ...faq, answer: value }) }))} />
          </ItemBox>
        ))}
      </SectionCard>

      <SectionCard
        title="정보 출처"
        description="공식 안내를 근거로 표시할 출처와 확인일을 관리합니다."
        onAdd={() => changeDraft((current) => ({ ...current, sources: [...current.sources, { label: '', url: '', checked_at: new Date().toISOString().slice(0, 10) }] }))}
      >
        {draft.sources.map((source: GuideSource, index) => (
          <ItemBox key={`source-${index}`} onRemove={() => changeDraft((current) => ({ ...current, sources: current.sources.filter((_, itemIndex) => itemIndex !== index) }))}>
            <Field label="출처명" value={source.label} onChange={(value) => changeDraft((current) => ({ ...current, sources: replaceAt(current.sources, index, { ...source, label: value }) }))} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="URL" value={source.url} onChange={(value) => changeDraft((current) => ({ ...current, sources: replaceAt(current.sources, index, { ...source, url: value }) }))} />
              <Field label="확인일 (YYYY-MM-DD)" value={source.checked_at} onChange={(value) => changeDraft((current) => ({ ...current, sources: replaceAt(current.sources, index, { ...source, checked_at: value }) }))} />
            </div>
          </ItemBox>
        ))}
      </SectionCard>

      <details className="rounded-3xl bg-white p-4 shadow-card sm:p-6">
        <summary className="cursor-pointer list-none text-sm font-bold text-slate-800">고급 JSON 편집</summary>
        <p className="mt-2 text-xs leading-5 text-slate-500">여러 항목을 한 번에 붙여넣을 때만 사용하세요. 적용 후 상단의 화면 저장 버튼을 눌러야 공개됩니다.</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setAdvancedJson(JSON.stringify(draft, null, 2))}>현재 폼 가져오기</Button>
          <Button type="button" variant="ghost" onClick={applyAdvancedJson}>JSON을 폼에 적용</Button>
        </div>
        <textarea className="mt-3 min-h-[28rem] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-brand-500" value={advancedJson} onChange={(event) => setAdvancedJson(event.target.value)} spellCheck={false} />
      </details>
    </div>
  );
}
