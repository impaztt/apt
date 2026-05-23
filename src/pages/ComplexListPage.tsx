import { Link } from 'react-router-dom';
import { ArrowRight, FileJson, Plus } from 'lucide-react';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { formatDate } from '../shared/utils/date';

export function ComplexListPage() {
  const { complexes, listings, loading, error } = useAppData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="단지 JSON 파일"
        description="각 단지의 기본정보와 매물은 JSON 파일 하나에 저장되며, 배포 시 화면에 자동 반영됩니다."
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
        <p className="text-sm font-semibold text-brand-700">데이터 저장 위치</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          단지별 파일을 <code className="rounded bg-white px-1.5 py-0.5 text-xs">src/data/complexes/단지-id.json</code>에
          추가하거나 교체한 뒤 GitHub에 푸시하면 Cloudflare 재배포 후 반영됩니다.
        </p>
      </Card>

      {complexes.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {complexes.map((complex) => {
            const related = listings.filter((listing) => listing.complex_id === complex.id);
            const verifiedDates = related
              .map((listing) => listing.verified_date)
              .filter((date): date is string => Boolean(date))
              .sort();
            const latestDate = verifiedDates[verifiedDates.length - 1] ?? null;
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
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    매물 {related.length}건 · 최근 확인 {formatDate(latestDate)}
                  </p>
                  <Link to={`/complexes/${complex.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    상세 <ArrowRight className="h-4 w-4" />
                  </Link>
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
