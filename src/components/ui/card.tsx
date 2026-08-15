import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  as: Component = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'article' | 'section';
}) {
  return (
    <Component className={cn('surface-panel rounded-[28px]', className)}>
      {children}
    </Component>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 pb-4 pt-6', className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
