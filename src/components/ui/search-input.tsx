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
    <div className={cn('flex h-12 items-center gap-2 rounded-full bg-surface px-4 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:bg-card focus-within:ring-4 focus-within:ring-pink/15', className)}>
      <Search size={15} className="text-text-muted" />
      <input
        className={cn('min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted', inputClassName)}
        {...props}
      />
    </div>
  );
}
