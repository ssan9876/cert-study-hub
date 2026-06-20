// App — application shell with auth + certification gating.
//
// Flow: bootstrap (check session) → if no user show AuthScreen → if no cert show
// CertPickerPage → otherwise render the cert study app (sidebar + routes). A
// background loop periodically syncs the active cert's progress to the server.

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar/Sidebar';
import { AuthScreen } from './components/Auth/AuthScreen';
import { CertPickerPage } from './pages/Certs/CertPickerPage';
import { useAppStore } from './store/useAppStore';
import { setActiveCert, getActiveCert } from './services/QuestionService';
import type { CertId } from './types/Cert';

import { HomePage } from './pages/Home/HomePage';
import { ExamPage } from './pages/Exam/ExamPage';
import { ReviewPage } from './pages/Review/ReviewPage';
import { ResultsPage } from './pages/Results/ResultsPage';
import { FlashcardsPage } from './pages/Flashcards/FlashcardsPage';
import { StatisticsPage } from './pages/Statistics/StatisticsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

/** Applies the persisted theme and font-scale settings to the <html> element. */
function useThemeEffect() {
  const theme = useAppStore((s) => s.settings.theme);
  const fontScale = useAppStore((s) => s.settings.fontScale);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.font = fontScale;
  }, [theme, fontScale]);
}

/** Periodically flushes the active cert's working set to the server when dirty. */
function useProgressSync() {
  useEffect(() => {
    let dirty = false;
    const unsub = useAppStore.subscribe(() => {
      dirty = true;
    });
    const id = window.setInterval(() => {
      const s = useAppStore.getState();
      if (dirty && s.user && s.activeCert) {
        dirty = false;
        void s.pushProgress();
      }
    }, 5000);
    // Best-effort flush when the tab is hidden/closed.
    const onHide = () => {
      const s = useAppStore.getState();
      if (s.user && s.activeCert) void s.pushProgress();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', onHide);
      unsub();
    };
  }, []);
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/** The authenticated study app for a selected certification. */
function CertApp({ cert }: { cert: CertId }) {
  // Ensure QuestionService points at the active cert before children read data.
  // (Needed after a page reload where the cert came from persisted state.)
  if (getActiveCert() !== cert) setActiveCert(cert);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      <Sidebar variant="rail" />
      <main className="scroll-area flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-8">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
              <Route path="/exam" element={<PageTransition><ExamPage /></PageTransition>} />
              <Route path="/review" element={<PageTransition><ReviewPage /></PageTransition>} />
              <Route path="/results" element={<PageTransition><ResultsPage /></PageTransition>} />
              <Route path="/flashcards" element={<PageTransition><FlashcardsPage /></PageTransition>} />
              <Route path="/statistics" element={<PageTransition><StatisticsPage /></PageTransition>} />
              <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
      <Sidebar variant="bottom" />
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-navy-950">
      <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-azure-500 border-t-transparent" />
        Loading…
      </div>
    </div>
  );
}

export function App() {
  useThemeEffect();
  useProgressSync();

  const bootstrapped = useAppStore((s) => s.bootstrapped);
  const user = useAppStore((s) => s.user);
  const activeCert = useAppStore((s) => s.activeCert);

  useEffect(() => {
    void useAppStore.getState().bootstrap();
  }, []);

  if (!bootstrapped) return <Splash />;
  if (!user) return <AuthScreen />;
  if (!activeCert) return <CertPickerPage />;
  return <CertApp cert={activeCert} key={activeCert} />;
}
