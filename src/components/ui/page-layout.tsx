import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageWidth = 'compact' | 'default' | 'wide';

const pageWidths: Record<PageWidth, string> = {
  compact: 'max-w-[760px]',
  default: 'max-w-[880px]',
  wide: 'max-w-[1040px]',
};

interface PageFrameProps {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
}

export function PageFrame({
  children,
  className,
  width = 'default',
}: PageFrameProps) {
  return (
    <div
      className={cn(
        'page-enter mx-auto w-full min-w-0 px-4 pb-10 pt-5 sm:px-6 sm:pt-7',
        pageWidths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-[-0.045em] text-text sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

