import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, FileJson, Save, Upload, TriangleAlert } from 'lucide-react';
import type { ParsedComplexData } from '../shared/data/staticData';
import { getStaticComplexSource, parseComplexDataFile } from '../shared/data/staticData';
import { summarizeListings } from '../features/listings/statistics';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { useAppData } from '../shared/data/AppDataContext';
import { formatPrice } from '../shared/utils/price';

const sampleJson = JSON.stringify(
  {
    complex_name: '새 아파트 단지명',
    source_text_type: '부동산 매물 목록 복사 텍스트',
    items: [
      {
        id: 1,
        complex_name: '새 아파트 단지명',
        building: '101동',
        deal_type: '매매',
        price_text: '8억 3,000',
        sale_price_text: '8억 3,000',
        supply_area_pyeong: 33,
        exclusive_area_pyeong: 25,
        floor_text: '12/25층',
        floor: '12',
        total_floor: 25,
        direction: '남향',
        verified_date: '2026.05.23',
      },
    ],
  },
  null,
  2,
);

function todayLocalDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function generatedComplexId(name: string): string {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `complex-${(hash >>> 0).toString(36)}`;
}

export function ComplexDataInputPage() {
  const { complexes, groups } = useAppData();
  const [searchParams] = useSearchParams();
  const requestedComplexId = searchParams.get('complexId');
  const [jsonText, setJsonText] = useState(sampleJson);
  const [preview, setPreview] = useState<ParsedComplexData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [selectedComplexId, setSelectedComplexId] = useState(requestedComplexId ?? complexes[0]?.id ?? '');
  const [adminKey, setAdminKey] = useState('');
  const [capturedDate, setCapturedDate] = useState(todayLocalDate);
  const [newComplexGroup, setNewComplexGroup] = useState(groups[0]?.name ?? '기본 비교 그룹');
  const [saving, setSaving] = useState(false);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  function parseInput(text: string, fileName?: string) {
    const input = JSON.parse(text) as unknown;
    let existingSource = requestedComplexId ? getStaticComplexSource(requestedComplexId) : null;
    let preparedInput = input;
    if (!existingSource && input && typeof input === 'object' && !Array.isArray(input)) {
      const record = input as Record<string, unknown>;
      const inputName = typeof record.complex_name === 'string'
        ? record.complex_name
        : typeof record.name === 'string'
          ? record.name
          : null;
      const matchingComplex = inputName ? complexes.find((complex) => complex.name === inputName.trim()) : null;
      existingSource = matchingComplex ? getStaticComplexSource(matchingComplex.id) : null;
      if (!existingSource && inputName?.trim() && Array.isArray(record.items)) {
        preparedInput = {
          ...record,
          id: typeof record.id === 'string' && record.id.trim() ? record.id : generatedComplexId(inputName.trim()),
          comparison_groups:
            Array.isArray(record.comparison_groups) && record.comparison_groups.length
              ? record.comparison_groups
              : [newComplexGroup.trim() || '기본 비교 그룹'],
        };
      }
    }
    return parseComplexDataFile(preparedInput, fileName, existingSource);
  }

  useEffect(() => {
    if (!requestedComplexId) return;
    const source = getStaticComplexSource(requestedComplexId);
    if (!source) {
      setHasError(true);
      setNotice('선택한 단지의 JSON 파일을 찾지 못했습니다.');
      return;
    }
    const nextText = JSON.stringify(source, null, 2);
    setSelectedComplexId(requestedComplexId);
    setJsonText(nextText);
    try {
      const result = parseComplexDataFile(source, `${requestedComplexId}.json`);
      setPreview(result);
      setHasError(false);
      setNotice(`${result.complex.name}의 현재 JSON을 불러왔습니다. listings 내용을 수정한 뒤 저장하세요.`);
    } catch (caught) {
      setPreview(null);
      setHasError(true);
      setNotice(caught instanceof Error ? caught.message : 'JSON 파일을 읽을 수 없습니다.');
    }
  }, [requestedComplexId]);

  function validate(text = jsonText, fileName?: string) {
    try {
      const result = parseInput(text, fileName);
      setPreview(result);
      setHasError(false);
      setCommitUrl(null);
      setNotice(
        result.inputFormat === 'collected-items'
          ? `${result.complex.name}의 수집 JSON을 변환했습니다. 매물 ${result.listings.length}건을 읽었으며, 저장 시 대시보드 형식으로 반영됩니다.`
          : `${result.fileName} 파일이 유효합니다. 매물 ${result.listings.length}건을 읽었습니다.`,
      );
    } catch (caught) {
      setPreview(null);
      setHasError(true);
      setNotice(caught instanceof Error ? caught.message : 'JSON 파일을 읽을 수 없습니다.');
    }
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
    validate(text, file.name);
    event.target.value = '';
  }

  function handleDownload() {
    if (!preview) return;
    const content = `${JSON.stringify(preview.source, null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = preview.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadCurrent() {
    const source = getStaticComplexSource(selectedComplexId);
    if (!source) {
      setHasError(true);
      setNotice('불러올 단지 JSON 파일을 찾지 못했습니다.');
      return;
    }
    const nextText = JSON.stringify(source, null, 2);
    setJsonText(nextText);
    validate(nextText, `${selectedComplexId}.json`);
  }

  async function handleGitHubSave() {
    if (!adminKey.trim()) {
      setHasError(true);
      setNotice('Cloudflare에 등록한 관리자 저장 키를 입력해 주세요.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedDate)) {
      setHasError(true);
      setNotice('수집 기준일을 선택해 주세요.');
      return;
    }

    let nextPreview: ParsedComplexData;
    try {
      nextPreview = parseInput(jsonText);
      setPreview(nextPreview);
    } catch (caught) {
      setHasError(true);
      setNotice(caught instanceof Error ? caught.message : 'JSON 파일을 읽을 수 없습니다.');
      return;
    }

    setSaving(true);
    setCommitUrl(null);
    try {
      const response = await fetch('/api/complex-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({
          operation: 'save_snapshot',
          captured_date: capturedDate,
          complex: nextPreview.source,
        }),
      });
      const result = (await response.json()) as { message?: string; commitUrl?: string | null };
      if (!response.ok) throw new Error(result.message ?? 'GitHub 저장 요청에 실패했습니다.');
      setHasError(false);
      setNotice(result.message ?? 'GitHub에 JSON 파일을 저장했습니다.');
      setCommitUrl(result.commitUrl ?? null);
    } catch (caught) {
      setHasError(true);
      setNotice(caught instanceof Error ? caught.message : 'GitHub 저장 요청에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const summaries = preview ? summarizeListings(preview.listings, [preview.complex]) : [];
  const isExistingPreview = preview ? complexes.some((complex) => complex.id === preview.complex.id) : Boolean(requestedComplexId);

  return (
    <div className="space-y-6">
      {requestedComplexId && (
        <Link to={`/complexes/${requestedComplexId}`} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
          <ArrowLeft className="h-4 w-4" /> 단지 상세로 돌아가기
        </Link>
      )}
      <PageHeader
        title={requestedComplexId ? '단지 매물 수정' : '새 단지 JSON 입력'}
        description={
          requestedComplexId
            ? '수집한 매물 JSON을 붙여넣고 수집 기준일별 스냅샷으로 저장합니다.'
            : '새 단지를 추가하거나, 기존 단지명의 매물 데이터를 날짜별 스냅샷으로 저장합니다.'
        }
      />

      <Card className="bg-brand-50 shadow-none">
        <p className="text-sm font-semibold text-brand-700">{requestedComplexId ? '기존 단지 수정 순서' : '신규 단지 추가 순서'}</p>
        {requestedComplexId ? (
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>1. 아래 내용을 전체 선택한 뒤, 정리한 <code className="rounded bg-white px-1.5 py-0.5 text-xs">complex_name / items</code> JSON을 그대로 붙여넣습니다.</li>
            <li>2. <code className="rounded bg-white px-1.5 py-0.5 text-xs">price_text</code>, <code className="rounded bg-white px-1.5 py-0.5 text-xs">supply_area_pyeong</code>, 날짜와 층 정보는 저장 형식으로 자동 변환됩니다.</li>
            <li>3. <strong>JSON 검증 및 미리보기</strong>로 평형별 매매 가격이 맞는지 확인합니다.</li>
            <li>4. 수집 기준일을 확인하고 관리자 저장 키를 입력한 뒤 <strong>오늘 데이터 저장</strong>을 누릅니다.</li>
            <li>5. 재배포 후 단지 상세와 대시보드에서 변경 내용을 확인합니다.</li>
          </ol>
        ) : (
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>1. 기존 단지 매물을 수정할 때는 <code className="rounded bg-white px-1.5 py-0.5 text-xs">complex_name / items</code> JSON을 그대로 붙여넣습니다. 단지명이 일치하면 자동으로 수정 대상으로 인식합니다.</li>
            <li>2. 새 단지도 <code className="rounded bg-white px-1.5 py-0.5 text-xs">complex_name / items</code>만 붙여넣으면 됩니다. 저장용 ID는 자동 생성됩니다.</li>
            <li>3. 새 단지일 때만 아래에서 포함할 비교 그룹을 확인하거나 수정합니다.</li>
            <li>4. 수집 기준일을 선택하고 관리자 저장 키로 저장합니다.</li>
            <li>5. 재배포 후 단지 목록과 비교 화면에 추가 또는 수정 내용이 표시됩니다.</li>
          </ol>
        )}
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-slate-500">
          저장 파일은 <code className="rounded bg-slate-50 px-1">snapshots/단지ID/수집일.json</code>으로 누적됩니다. 같은 날짜에 다시 저장하면
          해당 날짜 자료만 갱신됩니다. 대시보드 가격 비교는 매매 매물만 계산합니다.
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <FileJson className="h-5 w-5 text-brand-600" /> JSON 내용
          </p>
          <label className="cursor-pointer rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100">
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> 기존 JSON 불러오기
            </span>
            <input className="hidden" type="file" accept=".json,application/json" onChange={(event) => void handleFileSelect(event)} />
          </label>
        </div>
        {!requestedComplexId && complexes.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              className="field-control mt-0 flex-1"
              value={selectedComplexId}
              onChange={(event) => setSelectedComplexId(event.target.value)}
            >
              {complexes.map((complex) => (
                <option key={complex.id} value={complex.id}>
                  {complex.name}
                </option>
              ))}
            </select>
            <Button variant="ghost" onClick={handleLoadCurrent}>
              현재 단지 JSON 불러오기
            </Button>
          </div>
        )}
        {!requestedComplexId && (
          <label className="mt-4 block text-sm font-semibold text-slate-600">
            신규 단지 비교 그룹
            <input
              className="field-control mt-2"
              list="comparison-group-options"
              value={newComplexGroup}
              onChange={(event) => setNewComplexGroup(event.target.value)}
              placeholder="예: 화서역·정자동 비교"
            />
            <datalist id="comparison-group-options">
              {groups.map((group) => (
                <option key={group.id} value={group.name} />
              ))}
            </datalist>
            <span className="mt-2 block text-xs font-normal text-slate-400">
              기존 단지명과 일치하지 않는 JSON을 저장할 때 이 비교 그룹에 새 단지가 추가됩니다.
            </span>
          </label>
        )}
        <textarea
          className="field-control mt-4 min-h-[400px] resize-y font-mono text-xs leading-6"
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          spellCheck={false}
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => validate()}>
            JSON 검증 및 미리보기
          </Button>
          <Button disabled={!preview} onClick={handleDownload}>
            <span className="flex items-center justify-center gap-2">
              <Download className="h-4 w-4" /> JSON 파일 다운로드
            </span>
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">{isExistingPreview ? '수집일별 매물 저장' : '신규 단지 저장'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          관리자 저장 키는 GitHub 토큰이 아니라 Cloudflare에 설정한 별도 비밀번호입니다. GitHub 토큰은 서버 Secret에만 보관됩니다.
        </p>
        <label className="mt-4 block text-sm font-semibold text-slate-600">
          수집 기준일
          <input
            type="date"
            className="field-control mt-2"
            value={capturedDate}
            onChange={(event) => setCapturedDate(event.target.value)}
          />
          <span className="mt-2 block text-xs font-normal text-slate-400">
            웹에 매물 목록을 입력한 날짜입니다. 매물의 확인일과 별도로 기간별 호가 변화를 계산하는 기준입니다.
          </span>
        </label>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            autoComplete="current-password"
            className="field-control mt-0 flex-1"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="관리자 저장 키 입력"
          />
          <Button disabled={!preview || saving} onClick={() => void handleGitHubSave()}>
            <span className="flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> {saving ? '저장 중...' : isExistingPreview ? '오늘 데이터 저장' : '새 단지 저장'}
            </span>
          </Button>
        </div>
      </Card>

      {notice && (
        <div className={`flex gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${hasError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {hasError ? <TriangleAlert className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {notice}
          {commitUrl && (
            <a className="ml-auto shrink-0 underline" href={commitUrl} target="_blank" rel="noreferrer">
              커밋 확인
            </a>
          )}
        </div>
      )}

      {preview && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">파일 미리보기</h2>
          <Card>
            <p className="text-xs font-medium text-slate-400">{preview.fileName}</p>
            <h3 className="mt-2 text-xl font-bold">{preview.complex.name}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {preview.complex.region ?? '지역 미입력'} · 비교 그룹 {preview.groupNames.join(', ')}
            </p>
            <p className="mt-3 text-xs text-slate-400">전체 매물 {preview.listings.length}건</p>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((summary) => (
              <Card key={summary.area_group}>
                <p className="text-sm font-semibold text-slate-500">{summary.area_label}</p>
                <p className="metric-number mt-4 text-2xl font-bold">{formatPrice(summary.avg_price)}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {formatPrice(summary.min_price)} ~ {formatPrice(summary.max_price)} · {summary.listing_count}건
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
