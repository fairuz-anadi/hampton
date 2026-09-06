'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FlowButton({
  text = 'Modern Button',
  onClick,
  className,
  variant = 'dark',
}: {
  text?: string;
  onClick?: () => void;
  className?: string;
  /** dark = ink circle sweeping over paper. light = the inverse, for use on ink. */
  variant?: 'dark' | 'light';
}) {
  const ink = variant === 'dark' ? '#111111' : '#faf9f7';

  return (
    <button
      onClick={onClick}
      style={
        {
          borderColor: `${ink}40`,
          color: ink,
          '--flow-on': variant === 'dark' ? '#ffffff' : '#111111',
        } as React.CSSProperties
      }
      className={cn(
        'group relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] bg-transparent px-8 py-3',
        'text-sm font-semibold cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'hover:!border-transparent hover:rounded-[12px] active:scale-[0.95]',
        variant === 'dark' ? 'hover:text-white' : 'hover:text-[#111111]',
        className,
      )}
    >
      <ArrowRight
        style={{ stroke: ink }}
        className="absolute w-4 h-4 left-[-25%] fill-none z-[9] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-hover:!stroke-[var(--flow-on)]"
      />

      <span className="relative z-[1] -translate-x-3 transition-all duration-[800ms] ease-out group-hover:translate-x-3">
        {text}
      </span>

      <span
        style={{ background: ink }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-[50%] opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[260px] group-hover:w-[260px] group-hover:opacity-100"
      />

      <ArrowRight
        style={{ stroke: ink }}
        className="absolute w-4 h-4 right-4 fill-none z-[9] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-hover:!stroke-[var(--flow-on)]"
      />
    </button>
  );
}
