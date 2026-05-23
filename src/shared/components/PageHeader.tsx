import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">{description}</p>
      </div>
      {action}
    </div>
  );
}
