import { Search } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function SearchInput({
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  inputClassName?: string;
}) {
  return (
    <div className={cn('flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 transition-colors focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10', className)}>
      <Search size={15} className="text-text-muted" />
      <input
        className={cn('min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted', inputClassName)}
        {...props}
      />
    </div>
  );
}
