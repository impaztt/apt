import { Link } from 'react-router-dom';
import { ArrowRight, FileJson, Pencil, Plus } from 'lucide-react';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { formatDate } from '../shared/utils/date';
import { DeleteComplexDialog } from '../features/complexes/components/DeleteComplexDialog';

export function ComplexListPage() {
  const { complexes, listings, latestCapturedDates, loading, error } = useAppData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="단지 목록"
        description="단지를 선택해 수집일별 매물 스냅샷을 추가하고, 최신 분포와 기간 변화를 분석합니다."
        action={
          <Link to="/data/input">
            <Button>
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> JSON 만들기
              </span>
            </Button>
          </Link>
        }
      />

      <Card className="bg-brand-50 shadow-none">
        <p className="text-sm font-semibold text-brand-700">매물 수정 방법</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          아래 단지의 <strong>매물 수정</strong>에서 수집 JSON을 붙여넣고 <strong>수집 기준일</strong>을 선택해 저장하세요.
          날짜별 파일이 누적되므로 호가 변화 화면에서 가격과 매물 수 변화를 비교할 수 있습니다.
        </p>
      </Card>

      {complexes.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {complexes.map((complex) => {
            const related = listings.filter((listing) => listing.complex_id === complex.id);
            const latestDate = latestCapturedDates[complex.id] ?? null;
            return (
              <Card key={complex.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{complex.name}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {complex.region ?? '지역 미입력'} · {complex.built_year ? `${complex.built_year}년 준공` : '준공년도 미입력'}
                    </p>
                  </div>
                  <FileJson className="h-5 w-5 shrink-0 text-brand-500" />
                </div>
                <p className="mt-4 truncate rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                  src/data/complexes/{complex.data_file}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    최신 매물 {related.length}건 · 수집 기준일 {formatDate(latestDate)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/data/input?complexId=${complex.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
                    >
                      <Pencil className="h-4 w-4" /> 매물 수정
                    </Link>
                    <Link to={`/complexes/${complex.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
                      상세 <ArrowRight className="h-4 w-4" />
                    </Link>
                    <DeleteComplexDialog complex={complex} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="JSON 단지 파일이 없습니다" description="JSON 입력 화면에서 파일을 만든 뒤 데이터 폴더에 추가해 주세요." />
      )}
    </div>
  );
}
