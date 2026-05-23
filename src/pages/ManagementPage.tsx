import { Link } from 'react-router-dom';
import { Building2, FileJson, Layers3, Palette } from 'lucide-react';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';

const items = [
  { to: '/complexes', icon: Building2, title: '단지 관리', description: '단지별 최신 매물 조회, 수정, 삭제' },
  { to: '/data/input', icon: FileJson, title: 'JSON 입력', description: '수집일을 선택해 매물 데이터 저장' },
  { to: '/groups', icon: Layers3, title: '비교 그룹', description: '현재 비교 대상 단지 구성 확인' },
  { to: '/settings/display', icon: Palette, title: '표시 설정', description: '단지 색상과 평형 그룹 기준 수정' },
];

export function ManagementPage() {
  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader title="관리" description="데이터 입력과 단지 관리는 PC 사용을 권장합니다. 모바일에서는 분석 화면을 먼저 이용하세요." />
      <div className="space-y-3">
        {items.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="block">
            <Card className="flex items-center gap-4 p-4 sm:p-6">
              <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs text-slate-500">{description}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
