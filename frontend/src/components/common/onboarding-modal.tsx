'use client';

import * as React from 'react';
import { Mail, Sparkles, ShieldCheck, ArrowRight, X, CloudCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useProgressStore } from '@/lib/stores/progress-store';
import { syncProgressToFirestore } from '@/lib/firestore-sync';

export function OnboardingModal() {
  const { userEmail, setUserEmail, onboardingDismissed, setOnboardingDismissed } = useSettingsStore();
  const progressState = useProgressStore();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    // Only open for first-time visitors who haven't dismissed onboarding or set an email
    if (!onboardingDismissed && !userEmail) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingDismissed, userEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;

    setIsSubmitting(true);
    setUserEmail(emailInput.trim().toLowerCase());
    
    // Attempt Firestore sync
    await syncProgressToFirestore(emailInput.trim().toLowerCase(), progressState);
    
    setIsSubmitting(false);
    setSuccess(true);
    setOnboardingDismissed(true);

    setTimeout(() => {
      setIsOpen(false);
    }, 1500);
  };

  const handleSkip = () => {
    setOnboardingDismissed(true);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
      >
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {!success ? (
          <>
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                Welcome to meawakemecode
              </h2>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed max-w-sm mx-auto">
                30 days, 5 curated problems a day. Enter your email to save your streaks, sync across devices, and maintain your practice history.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] flex items-center justify-between">
                  <span>Your Email Address</span>
                  <span className="text-[11px] font-normal text-[rgb(var(--text-muted))]">Encrypted & Private</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !emailInput.includes('@')}
                className="w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Saving...' : 'Sync & Start Practice'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="flex flex-col items-center gap-3 pt-1 border-t border-[rgb(var(--border))]">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                Continue as Guest (Local browser only)
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--text-muted))]">
                <ShieldCheck className="w-3.5 h-3.5 text-[rgb(var(--success))]" />
                <span>Zero spam. No unsolicited marketing.</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))] flex items-center justify-center mx-auto">
              <CloudCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
              Progress Synced!
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Your profile is connected to <span className="font-mono text-[rgb(var(--accent))]">{emailInput}</span>. Let's conquer Day 1!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

