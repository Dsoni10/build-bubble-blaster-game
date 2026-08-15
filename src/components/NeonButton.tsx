import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

const variants: Record<string, string> = {
  primary:
    'bg-gradient-to-b from-cyan-300 to-sky-500 text-slate-900 shadow-[0_0_25px_rgba(56,224,255,0.55)] hover:shadow-[0_0_38px_rgba(56,224,255,0.85)] border-cyan-200/60',
  secondary:
    'bg-white/10 text-cyan-50 border-white/20 hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]',
  ghost: 'bg-transparent text-cyan-100/80 border-transparent hover:text-white',
};

export function NeonButton({ variant = 'primary', className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-base font-extrabold uppercase tracking-wide transition-all duration-150 active:scale-95',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
