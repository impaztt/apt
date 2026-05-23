import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`rounded-3xl bg-white p-5 shadow-card sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
