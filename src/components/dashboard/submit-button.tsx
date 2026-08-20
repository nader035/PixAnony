'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function DashboardSubmitButton({
  children,
  className,
  confirmMessage,
  name,
  value,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled || pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-xs font-bold transition-colors disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
