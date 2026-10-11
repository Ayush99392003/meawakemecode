'use client';

import * as React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Code2,
  Lock,
  Download,
  Trash2,
  RefreshCw,
  Bell,
  Check,
  ShieldAlert,
  Cloud,
  Mail,
  CheckCircle2,
  ArrowRight,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  useSettingsStore,
  type ThemeMode,
  type PreferredLanguage,
} from '@/lib/stores/settings-store';
import { useProgressStore } from '@/lib/stores/progress-store';
import {
  syncProgressToFirestore,
  loadProgressFromFirestore,
  queueEmailRequest,
} from '@/lib/firestore-sync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    preferredLanguage,
    setPreferredLanguage,
    strictMode,
    setStrictMode,
    compactMode,
    setCompactMode,
    reminderEnabled,
    setReminderEnabled,
    reminderTime,
    setReminderTime,
    userEmail,
    setUserEmail,
    bgIntensity,
    setBgIntensity,
  } = useSettingsStore();

  const progress = useProgressStore();
  const { reset, problems, dayCompletions } = progress;

  const [exportSuccess, setExportSuccess] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
  const [restoreStatus, setRestoreStatus] = React.useState<string | null>(null);
  const [emailStatus, setEmailStatus] = React.useState<string | null>(null);
  const [emailDraft, setEmailDraft] = React.useState(userEmail || '');

  const handleManualSync = async () => {
    if (!emailDraft || !emailDraft.includes('@')) return;
    setSyncStatus('syncing');
    const cleanEmail = emailDraft.trim().toLowerCase();
    setUserEmail(cleanEmail);
    const ok = await syncProgressToFirestore(cleanEmail, progress);
    if (ok) {
      await queueEmailRequest(cleanEmail, 'welcome', {
        type: 'welcome',
        syncedAt: new Date().toISOString(),
      });
    }
    setSyncStatus(ok ? 'synced' : 'failed');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleRestoreCloud = async () => {
    if (!emailDraft || !emailDraft.includes('@')) return;
    const cleanEmail = emailDraft.trim().toLowerCase();
    setRestoreStatus('Checking cloud...');
    try {
      const cloudData = await loadProgressFromFirestore(cleanEmail);
      if (cloudData) {
        progress.mergeState(cloudData);
        const pCount = Object.keys(cloudData.problems || {}).length;
        const dCount = Object.keys(cloudData.dayCompletions || {}).length;
        setRestoreStatus(`Restored: ${pCount} problems, ${dCount} days.`);
      } else {
        setRestoreStatus('No cloud backup found for this email.');
      }
    } catch {
      setRestoreStatus('Failed to load from cloud.');
    }
    setTimeout(() => setRestoreStatus(null), 4000);
  };

  const handleSendTestEmail = async (type: 'badge' | 'trash_warning' | 'accountability' | 'welcome') => {
    const targetEmail = (emailDraft || userEmail || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('Please enter your valid email address first.');
      return;
    }

    setEmailStatus(`Dispatching ${type}...`);
    try {
      await queueEmailRequest(targetEmail, type, {
        dayNumber: 1,
        hoursLeft: 3,
        currentStreak: 0,
        roastQuote: 'Things can be tough, but quitting won\'t get you anywhere. Get back to work.',
      });
      setEmailStatus(`Dispatched to ${targetEmail}! Check your inbox/spam.`);
    } catch {
      setEmailStatus('Dispatch failed. Please check your connection.');
    }
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      problems,
      dayCompletions,
      settings: { theme, preferredLanguage, strictMode },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meawakemecode-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all your solved problems, day completions, and streaks? This cannot be undone.'
      )
    ) {
      reset();
      alert('Your progress has been reset.');
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
          Preferences & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-0.5">
          Customize your interview training environment, code snippets, and rules.
        </p>
      </div>

      {/* 1. Appearance */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
          Appearance & Language
        </h2>

        {/* Theme mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
            Interface Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ['system', 'System Default', Laptop],
                ['light', 'Light Mode', Sun],
                ['dark', 'Dark Mode', Moon],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-[var(--radius-sm)] border text-xs font-semibold transition-all cursor-pointer',
                  theme === mode
                    ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)] text-[rgb(var(--accent))] ring-1 ring-[rgb(var(--accent))]'
                    : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Language */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
            Primary Programming Language
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ['cpp', 'C++ (STL)'],
                ['java', 'Java 21'],
                ['python', 'Python 3'],
              ] as const
            ).map(([lang, label]) => (
              <button
                key={lang}
                onClick={() => setPreferredLanguage(lang as PreferredLanguage)}
                className={cn(
                  'p-3 rounded-[var(--radius-sm)] border text-xs font-semibold transition-all cursor-pointer text-center',
                  preferredLanguage === lang
                    ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)] text-[rgb(var(--accent))] ring-1 ring-[rgb(var(--accent))]'
                    : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[rgb(var(--text-muted))]">
            Synchronizes syntax highlighting tabs and code templates across all day guides.
          </p>
        </div>

        {/* Background Animation Intensity */}
        <div className="space-y-3 pt-2 border-t border-[rgb(var(--border))]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
              Background Animation Intensity
            </label>
            <span className="text-xs font-mono font-bold text-[rgb(var(--accent))]">
              {Math.round((bgIntensity ?? 0.7) * 100)}%
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            <span className="text-[10px] text-[rgb(var(--text-muted))] w-6 text-center shrink-0">Off</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bgIntensity ?? 0.7}
              onChange={(e) => setBgIntensity(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full accent-[rgb(var(--accent))] cursor-pointer bg-[rgb(var(--surface-raised))]"
            />
            <span className="text-[10px] text-[rgb(var(--text-muted))] w-6 text-center shrink-0">Full</span>
          </div>
          <p className="text-[11px] text-[rgb(var(--text-muted))]">
            Particle network scales automatically to your screen size. Slide to 0 to disable.
          </p>
        </div>
      </Card>

      {/* 2. Rules & Strict Mode */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
          Curriculum Rules & Enforcement
        </h2>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[rgb(var(--accent))]" />
              Strict Daily Lockout
            </label>
            <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
              When enabled, future days remain locked until the current day&apos;s curriculum is 5/5 cleared. Helps eliminate cognitive overload and skips.
            </p>
          </div>

          <button
            onClick={() => setStrictMode(!strictMode)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2',
              strictMode ? 'bg-[rgb(var(--accent))]' : 'bg-[rgb(var(--border))]'
            )}
            role="switch"
            aria-checked={strictMode}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                strictMode ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </Card>

      {/* 3. Daily Reminders */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
          Daily Study Reminders
        </h2>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[rgb(var(--warning))]" />
              Enable Daily Nudge
            </span>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Alert you before midnight if today&apos;s 5 problems are unfinished.
            </p>
          </div>

          <button
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
              reminderEnabled ? 'bg-[rgb(var(--accent))]' : 'bg-[rgb(var(--border))]'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                reminderEnabled ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div className="pt-3 border-t border-[rgb(var(--border))] flex items-center justify-between text-xs">
            <span className="text-[rgb(var(--text-secondary))]">Preferred Reminder Time</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="px-2.5 py-1 rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] font-mono text-xs"
            />
          </div>
        )}
      </Card>

      {/* Account & Cloud Sync */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[rgb(var(--accent))]" />
              Account & Cloud Sync
            </h2>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Backup your solved problem checks and streak counts to Firebase Firestore.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Enter your email to sync"
              className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing' || !emailDraft.includes('@')}
              className="h-10 px-4 font-bold"
            >
              {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {syncStatus === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-[rgb(var(--success))]" />}
              <span>
                {syncStatus === 'syncing'
                  ? 'Syncing...'
                  : syncStatus === 'synced'
                  ? 'Synced!'
                  : syncStatus === 'failed'
                  ? 'Sync Failed'
                  : 'Sync to Cloud'}
              </span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleRestoreCloud}
              disabled={!emailDraft.includes('@')}
              className="h-10 px-4"
              title="Pull saved progress from cloud and merge into this device"
            >
              <span>Restore from Cloud</span>
            </Button>
          </div>
        </div>

        {restoreStatus && (
          <p className="text-xs text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded">
            {restoreStatus}
          </p>
        )}

        {userEmail && (
          <p className="text-[11px] text-[rgb(var(--text-muted))] flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-[rgb(var(--success))]" />
            Connected account: <span className="font-mono text-[rgb(var(--text-primary))]">{userEmail}</span>
          </p>
        )}
      </Card>

      {/* Email Notifications & Accountability Dispatcher */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
              <Send className="w-5 h-5 text-[rgb(var(--accent))]" />
              Accountability &amp; Badge Emails
            </h2>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Receive verified milestone badges, urgent slacking warnings, and tough-love accountability emails.
            </p>
          </div>
        </div>

        {emailStatus && (
          <p className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded">
            {emailStatus}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => handleSendTestEmail('welcome')}
            className="p-3 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] hover:bg-[rgb(var(--surface))] hover:border-indigo-500/50 text-left transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-xs font-bold text-[rgb(var(--text-primary))] group-hover:text-indigo-400 transition-colors">
                Welcome Email
              </span>
            </div>
            <p className="text-[11px] text-[rgb(var(--text-muted))] leading-relaxed">
              Dispatches onboarding commitment email with Day 1 starter link and reverse protocol rules.
            </p>
          </button>

          <button
            onClick={() => handleSendTestEmail('badge')}
            className="p-3 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] hover:bg-[rgb(var(--surface))] hover:border-emerald-500/50 text-left transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏆</span>
              <span className="text-xs font-bold text-[rgb(var(--text-primary))] group-hover:text-emerald-400 transition-colors">
                Badge Unlocked
              </span>
            </div>
            <p className="text-[11px] text-[rgb(var(--text-muted))] leading-relaxed">
              Dispatches milestone completion badge celebrating your verified solve streak.
            </p>
          </button>

          <button
            onClick={() => handleSendTestEmail('trash_warning')}
            className="p-3 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] hover:bg-[rgb(var(--surface))] hover:border-amber-500/50 text-left transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold text-[rgb(var(--text-primary))] group-hover:text-amber-400 transition-colors">
                Trash Badge Warning
              </span>
            </div>
            <p className="text-[11px] text-[rgb(var(--text-muted))] leading-relaxed">
              Urgent countdown: complete today&apos;s quota before midnight to avoid Slacker Trash Badge.
            </p>
          </button>

          <button
            onClick={() => handleSendTestEmail('accountability')}
            className="p-3 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] hover:bg-[rgb(var(--surface))] hover:border-rose-500/50 text-left transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span className="text-xs font-bold text-[rgb(var(--text-primary))] group-hover:text-rose-400 transition-colors">
                Tough Love Reality Check
              </span>
            </div>
            <p className="text-[11px] text-[rgb(var(--text-muted))] leading-relaxed">
              &ldquo;Things can be tough, but quitting won&apos;t get you anywhere&rdquo;—harsh reset email.
            </p>
          </button>
        </div>
      </Card>

      {/* 4. Data Management */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
          Data & Privacy
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div>
            <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">
              Backup Progress Data
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Download your entire problem progress and personal notes as a JSON file.
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportData}
            className="shrink-0"
          >
            {exportSuccess ? (
              <Check className="w-3.5 h-3.5 text-[rgb(var(--success))]" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exportSuccess ? 'Downloaded!' : 'Export JSON'}</span>
          </Button>
        </div>

        <div className="pt-4 border-t border-[rgb(var(--border))] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-[rgb(var(--danger))]">
              Reset All Progress
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Clear all ticked problems, daily notes, and streaks from this browser.
            </p>
          </div>

          <Button
            size="sm"
            variant="danger"
            onClick={handleReset}
            className="shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

