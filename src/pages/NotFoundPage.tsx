import { Link } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { EmptyState } from '../shared/components/States';

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <EmptyState title="페이지를 찾을 수 없습니다" description="주소를 확인하거나 대시보드로 이동해 주세요." />
      <Link to="/" className="block">
        <Button fullWidth>대시보드로 이동</Button>
      </Link>
    </div>
  );
}
