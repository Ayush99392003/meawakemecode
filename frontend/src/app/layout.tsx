import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { OnboardingModal } from '@/components/common/onboarding-modal';
import { LeftSidebar, RightSidebar } from '@/components/layout/desktop-sidebars';
import { ClientLayout } from '@/components/layout/client-layout';
import { themeScript } from '@/lib/theme-script';
import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'meawakemecode — 30-Day DSA Sheet',
    template: '%s | meawakemecode',
  },
  description:
    '30 days, 5 problems a day. Strict rules, warm wording, LeetCode and Codeforces practice, and complete CS fundamentals.',
  authors: [{ name: 'Ayush Agarwal', url: 'mailto:ayush20039939@gmail.com' }],
  creator: 'Ayush Agarwal',
  metadataBase: new URL('https://meawakemecode.com'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] font-sans antialiased selection:bg-[rgb(var(--accent)/0.2)] selection:text-[rgb(var(--accent))]">
        <ClientLayout>
          <Header />
          <main className="flex-1 pb-20 md:pb-6">
            {/* Full-width desktop 3-column layout */}
            <div className="flex items-start gap-6 w-full max-w-[1600px] mx-auto px-4 xl:px-8 pt-2">
              <LeftSidebar />
              <div className="flex-1 min-w-0">
                {children}
              </div>
              <RightSidebar />
            </div>
          </main>
          <Footer />
          <BottomNav />
          <OnboardingModal />
        </ClientLayout>
      </body>
    </html>
  );
}
