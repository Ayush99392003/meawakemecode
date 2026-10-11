import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div>
        <span className="text-xs font-mono font-semibold text-[rgb(var(--accent))] uppercase tracking-wider">
          LEGAL & PRIVACY
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] mt-1">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-1">
          Last updated: November 2026
        </p>
      </div>

      <Card className="p-6 space-y-4 text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
        <div className="flex items-center gap-2 text-[rgb(var(--success))] font-semibold">
          <ShieldCheck className="w-5 h-5" />
          <span>Local-First & Client-Persisted by Default</span>
        </div>

        <p>
          At <strong>meawakemecode</strong>, we respect your privacy. By default, your problem completions, personal code notes, streaks, and settings are saved locally inside your browser via LocalStorage.
        </p>

        <h2 className="font-bold text-sm text-[rgb(var(--text-primary))] pt-2">
          Data Collection & Email
        </h2>
        <p>
          We do not sell, rent, or share personal information. If you opt into email reminders or cloud backup, your email address is used solely for authentication and notifications.
        </p>

        <h2 className="font-bold text-sm text-[rgb(var(--text-primary))] pt-2">
          Data Export & Deletion
        </h2>
        <p>
          You retain full control over your data. You can export your progress records to JSON at any moment, or wipe all records with one click in the Settings tab.
        </p>

        <p className="pt-2 text-[11px] text-[rgb(var(--text-muted))]">
          For any questions or privacy inquiries, contact{' '}
          <a
            href="mailto:ayush20039939@gmail.com"
            className="text-[rgb(var(--accent))] underline"
          >
            ayush20039939@gmail.com
          </a>
          .
        </p>
      </Card>
    </div>
  );
}

