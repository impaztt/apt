import { Link } from 'react-router-dom';
import { FileJson, Scale } from 'lucide-react';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';

export function GroupManagementPage() {
  const { groups, memberships, complexes, loading, error } = useAppData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="비교 그룹"
        description="비교 그룹은 각 단지 JSON 파일의 comparison_groups 배열에서 자동 구성됩니다."
        action={
          <Link to="/compare">
            <Button variant="secondary">
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4" /> 비교 화면
              </span>
            </Button>
          </Link>
        }
      />

      <Card className="flex gap-3 bg-slate-50 shadow-none">
        <FileJson className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <p className="text-sm leading-6 text-slate-600">
          같은 그룹에서 비교할 단지 파일마다 동일한 그룹명을 입력하세요. 예:
          <code className="ml-1 rounded bg-white px-1.5 py-0.5 text-xs">{`"comparison_groups": ["화서역·정자동 대형단지 비교"]`}</code>
        </p>
      </Card>

      {groups.length ? (
        <div className="space-y-4">
          {groups.map((group) => {
            const groupComplexes = memberships
              .filter((membership) => membership.group_id === group.id)
              .map((membership) => complexes.find((complex) => complex.id === membership.complex_id))
              .filter((complex) => complex !== undefined);
            return (
              <Card key={group.id}>
                <h2 className="font-bold">{group.name}</h2>
                <p className="mt-2 text-sm text-slate-500">포함 단지 {groupComplexes.length}개</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {groupComplexes.map((complex) => (
                    <Link
                      to={`/complexes/${complex.id}`}
                      key={complex.id}
                      className="rounded-full bg-slate-50 px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700"
                    >
                      {complex.name}
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="비교 그룹이 없습니다" description="단지 JSON에 comparison_groups를 입력하면 자동 생성됩니다." />
      )}
    </div>
  );
}
