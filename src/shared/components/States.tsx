import { AlertCircle, Database } from 'lucide-react';
import { Card } from './Card';

export function LoadingState() {
  return (
    <Card className="flex items-center gap-3 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />
      데이터를 불러오는 중입니다.
    </Card>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="flex items-start gap-3 bg-red-50 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      {message}
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col items-center py-12 text-center">
      <Database className="mb-4 h-9 w-9 text-slate-300" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </Card>
  );
}
