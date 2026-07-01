import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageWidth = 'compact' | 'default' | 'wide';

const pageWidths: Record<PageWidth, string> = {
  compact: 'max-w-[760px]',
  default: 'max-w-[900px]',
  wide: 'max-w-[1080px]',
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
        'page-enter w-full min-w-0 px-4 pb-12 pt-5 sm:px-6 sm:pt-7 xl:px-7',
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
          <p className="mb-2 text-xs font-semibold uppercase text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold text-text sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
