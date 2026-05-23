import type { PropsWithChildren, ReactNode } from 'react';

interface FieldProps {
  label: string;
  description?: ReactNode;
  error?: string;
}

export function Field({ label, description, error, children }: PropsWithChildren<FieldProps>) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {description && <span className="ml-2 text-xs font-normal text-slate-400">{description}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
