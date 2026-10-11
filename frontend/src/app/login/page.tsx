'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, ChevronLeft, RefreshCw, Cloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useProgressStore } from '@/lib/stores/progress-store';
import {
  syncProgressToFirestore,
  loadProgressFromFirestore,
  queueEmailRequest,
} from '@/lib/firestore-sync';

export default function LoginPage() {
  const { userEmail, setUserEmail } = useSettingsStore();
  const progress = useProgressStore();
  const { mergeState } = progress;

  const [email, setEmail] = React.useState(userEmail || '');
  const [loading, setLoading] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{
    success: boolean;
    restoredProblems: number;
    restoredDays: number;
    isNew: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    setLoading(true);
    setUserEmail(cleanEmail);

    try {
      // 1. Check if cloud profile already exists
      const cloudData = await loadProgressFromFirestore(cleanEmail);

      let restoredProblems = 0;
      let restoredDays = 0;
      let isNew = true;

      if (cloudData) {
        isNew = false;
        restoredProblems = Object.keys(cloudData.problems || {}).length;
        restoredDays = Object.keys(cloudData.dayCompletions || {}).length;
        // Merge cloud data into current device store
        mergeState(cloudData);
      }

      // 2. Sync updated local state back to Firestore
      const latestProgress = useProgressStore.getState();
      await syncProgressToFirestore(cleanEmail, latestProgress);

      // 3. Queue a welcome & onboarding commitment email
      await queueEmailRequest(cleanEmail, 'welcome', {
        type: 'welcome',
        syncedAt: new Date().toISOString(),
      });

      setSyncResult({
        success: true,
        restoredProblems,
        restoredDays,
        isNew,
      });
    } catch (err) {
      console.error('Login sync error:', err);
      setSyncResult({
        success: false,
        restoredProblems: 0,
        restoredDays: 0,
        isNew: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto px-4 py-12 sm:py-20 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Today</span>
      </Link>

      <Card className="p-6 sm:p-8 space-y-6 shadow-lg border-[rgb(var(--border))]">
        {!syncResult?.success ? (
          <>
            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))] flex items-center justify-center mx-auto mb-3">
                <Cloud className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                Sync &amp; Restore Your Progress
              </h1>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
                Connect your email address to sync solved problems, streaks, and verified badges across your laptop, phone, and tablet.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full font-bold" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Connecting to Cloud...</span>
                  </>
                ) : (
                  <>
                    <span>Sync Progress Now</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-[rgb(var(--text-muted))] leading-relaxed flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[rgb(var(--success))]" />
                Your progress is stored securely and merged non-destructively.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center space-y-5 py-2 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">
                Account Synced Successfully!
              </h2>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed font-mono">
                Connected: <strong className="text-emerald-400">{email}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-xs text-left space-y-1 font-mono">
              <div className="flex justify-between text-[rgb(var(--text-secondary))]">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-bold">{syncResult.isNew ? 'New Cloud Backup' : 'Existing Profile Merged'}</span>
              </div>
              <div className="flex justify-between text-[rgb(var(--text-secondary))]">
                <span>Cloud Records Restored:</span>
                <span className="text-[rgb(var(--text-primary))] font-bold">{syncResult.restoredProblems} Problems · {syncResult.restoredDays} Days</span>
              </div>
              <div className="flex justify-between text-[rgb(var(--text-secondary))]">
                <span>Auto-Sync:</span>
                <span className="text-cyan-400">Active</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Link href="/" className="flex-1">
                <Button variant="primary" className="w-full">
                  <span>Continue to Today</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/me" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <span>View Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
