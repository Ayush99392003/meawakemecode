import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PreferredLanguage = 'java' | 'cpp' | 'python';

interface SettingsState {
  theme: ThemeMode;
  preferredLanguage: PreferredLanguage;
  strictMode: boolean;
  compactMode: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  timezone: string;
  userEmail: string | null;
  onboardingDismissed: boolean;
  /** Background animation intensity: 0 = off, 0.5 = subtle, 1 = full */
  bgIntensity: number;
  
  setTheme: (theme: ThemeMode) => void;
  setPreferredLanguage: (lang: PreferredLanguage) => void;
  setStrictMode: (strict: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  setTimezone: (tz: string) => void;
  setUserEmail: (email: string | null) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
  setBgIntensity: (intensity: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      preferredLanguage: 'cpp',
      strictMode: true,
      compactMode: false,
      reminderEnabled: false,
      reminderTime: '20:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userEmail: null,
      onboardingDismissed: false,
      bgIntensity: 0.7,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setPreferredLanguage: (preferredLanguage) => set({ preferredLanguage }),
      setStrictMode: (strictMode) => set({ strictMode }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
      setTimezone: (timezone) => set({ timezone }),
      setUserEmail: (userEmail) => set({ userEmail }),
      setOnboardingDismissed: (onboardingDismissed) => set({ onboardingDismissed }),
      setBgIntensity: (bgIntensity) => set({ bgIntensity: Math.min(1, Math.max(0, bgIntensity)) }),
    }),
    {
      name: 'dsa-sheet-settings-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applyTheme(state.theme);
          }
        };
      },
    }
  )
);

function applyTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
  
  localStorage.setItem('dsa-sheet-theme', theme);
}
