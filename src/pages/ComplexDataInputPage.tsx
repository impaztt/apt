import { useState, type ChangeEvent } from 'react';
import { CheckCircle2, Download, FileJson, Upload, TriangleAlert } from 'lucide-react';
import type { ParsedComplexData } from '../shared/data/staticData';
import { parseComplexDataFile } from '../shared/data/staticData';
import { summarizeListings } from '../features/listings/statistics';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { formatPrice } from '../shared/utils/price';

const sampleJson = JSON.stringify(
  {
    id: 'new-complex-id',
    name: '새 아파트 단지명',
    region: '수원시 장안구 정자동',
    address: '경기도 수원시 장안구 정자동',
    built_year: 2020,
    household_count: 1200,
    brand: '브랜드명',
    updated_at: '2026-05-23',
    comparison_groups: ['화서역·정자동 대형단지 비교'],
    listings: [
      {
        building_no: '101동',
        deal_type: '매매',
        price: 830000000,
        exclusive_area_m2: 84,
        floor: 12,
        total_floor: 25,
        direction: '남향',
        verified_date: '2026-05-23',
        source: '네이버부동산',
      },
    ],
  },
  null,
  2,
);

export function ComplexDataInputPage() {
  const [jsonText, setJsonText] = useState(sampleJson);
  const [preview, setPreview] = useState<ParsedComplexData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  function validate(text = jsonText, fileName?: string) {
    try {
      const result = parseComplexDataFile(JSON.parse(text) as unknown, fileName);
      setPreview(result);
      setHasError(false);
      setNotice(`${result.fileName} 파일이 유효합니다. 매물 ${result.listings.length}건을 읽었습니다.`);
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

  const summaries = preview ? summarizeListings(preview.listings, [preview.complex]) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="단지 JSON 입력"
        description="단지 하나와 해당 매물 전체를 담은 JSON 파일을 검증하고 생성합니다."
      />

      <Card className="bg-brand-50 shadow-none">
        <p className="text-sm font-semibold text-brand-700">실제 화면 반영 절차</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          아래에서 검증한 JSON을 다운로드한 뒤
          <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs">src/data/complexes/</code>
          폴더에 넣고 GitHub에 푸시하세요. 정적 웹페이지는 브라우저에서 배포 파일을 직접 수정할 수 없습니다.
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

      {notice && (
        <div className={`flex gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${hasError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {hasError ? <TriangleAlert className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {notice}
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
                <p className="text-sm font-semibold text-slate-500">전용 {summary.area_group}㎡</p>
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
