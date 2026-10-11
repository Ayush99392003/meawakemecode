import * as React from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div>
        <span className="text-xs font-mono font-semibold text-[rgb(var(--accent))] uppercase tracking-wider">
          ABOUT THE PLATFORM
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] mt-1">
          meawakemecode — 30-Day Technical Prep
        </h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] mt-2 leading-relaxed">
          A hyper-focused, disciplined 30-day DSA training plan combining LeetCode algorithmic fundamentals with fast Codeforces problem-solving and rigorous CS engineering principles.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
          The Philosophy: Strict Rules, Warm Wording
        </h2>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
          Interview preparation fails when candidates encounter cognitive overload, choice fatigue, or lack of daily accountability. meawakemecode removes the noise by prescribing exactly 5 problems every day: 3 LeetCode patterns for structured problem archetypes and 2 Codeforces puzzles to train edge-case anticipation and quick implementation.
        </p>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
          Creator & Author
        </h2>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
          Built by <strong>Ayush Agarwal</strong>. Designed for software engineers aiming for top-tier tech roles.
        </p>
        <div className="pt-2">
          <a
            href="mailto:ayush20039939@gmail.com"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[rgb(var(--accent))] hover:underline"
          >
            <Mail className="w-4 h-4" />
            <span>ayush20039939@gmail.com</span>
          </a>
        </div>
      </Card>

      <div className="pt-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="primary">
            <span>Start Practice Today</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/sheet">
          <Button variant="secondary">Browse 30-Day Sheet</Button>
        </Link>
      </div>
    </div>
  );
}

