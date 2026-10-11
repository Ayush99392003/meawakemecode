'use client';

import * as React from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms delay before the reveal transition starts
}

/**
 * Wraps children with a fade + slide-up animation triggered by IntersectionObserver.
 * Delay staggers child sections so they reveal sequentially.
 */
export function RevealOnScroll({ children, className, delay = 0 }: RevealOnScrollProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

