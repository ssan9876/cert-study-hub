// useAppStore — the single Zustand store backing the whole application.
//
// It persists to localStorage (via the `persist` middleware) so an in-progress
// exam survives a browser refresh and all history/settings/flashcard progress
// is retained offline. Components select only the slices they need.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  ExamConfig,
  ExamSession,
  ExamResult,
  Settings,
} from '../types/Exam';
import type { UserResponse } from '../types/Question';
import type { CardProgress } from '../types/Flashcard';
import type { CertId } from '../types/Cert';
import { generateExam } from '../services/ExamGenerator';
import { gradeSession } from '../services/AnalyticsService';
import { initialProgress, review as reviewCard } from '../services/SpacedRepetition';
import { setActiveCert } from '../services/QuestionService';
import { api, type AuthUser } from '../services/api';

export const STORAGE_KEY = 'cert-study-hub:v2';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  timerEnabled: true,
  fontScale: 'md',
  instantFeedback: false,
};

interface AppState {
  // ---- auth ----
  user: AuthUser | null;
  /** True once the initial /me check has completed. */
  bootstrapped: boolean;
  authError: string | null;

  // ---- active certification ----
  /** null = no cert chosen yet (show the cert picker). */
  activeCert: CertId | null;
  /** True while progress for the active cert is being fetched. */
  hydrating: boolean;

  // ---- per-(user, cert) working set (persisted locally as a cache) ----
  settings: Settings;
  history: ExamResult[];
  flashProgress: Record<string, CardProgress>;
  activeSession: ExamSession | null;
  /** The most recent graded result, surfaced on the results page. */
  lastResult: ExamResult | null;

  // ---- auth actions ----
  bootstrap: () => Promise<void>;
  register: (username: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // ---- certification actions ----
  selectCert: (cert: CertId) => Promise<void>;
  clearCert: () => void;
  /** Push the active cert's working set to the server (called by the sync loop). */
  pushProgress: () => Promise<void>;

  // ---- settings actions ----
  updateSettings: (partial: Partial<Settings>) => void;
  toggleTheme: () => void;

  // ---- exam lifecycle ----
  startExam: (config: ExamConfig) => ExamSession | null;
  answerQuestion: (questionId: string, patch: Partial<UserResponse>) => void;
  setCurrentIndex: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setConfidence: (questionId: string, confidence: number) => void;
  toggleBookmark: (questionId: string) => void;
  toggleFlag: (questionId: string) => void;
  tickTimer: (remainingSeconds: number) => void;
  addTimeSpent: (questionId: string, seconds: number) => void;
  submitExam: () => ExamResult | null;
  abandonExam: () => void;

  // ---- flashcards ----
  reviewFlashcard: (cardId: string, success: boolean) => void;

  // ---- data management ----
  resetAllProgress: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

/** Ensure a response object exists for a question id, returning a fresh copy. */
function withResponse(
  responses: Record<string, UserResponse>,
  questionId: string,
  patch: Partial<UserResponse>,
): Record<string, UserResponse> {
  const existing = responses[questionId] ?? { questionId };
  return { ...responses, [questionId]: { ...existing, ...patch } };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      bootstrapped: false,
      authError: null,
      activeCert: null,
      hydrating: false,

      settings: DEFAULT_SETTINGS,
      history: [],
      flashProgress: {},
      activeSession: null,
      lastResult: null,

      // ---- auth ----
      bootstrap: async () => {
        try {
          const { user } = await api.me();
          set({ user });
        } catch {
          set({ user: null });
        } finally {
          set({ bootstrapped: true });
        }
      },

      register: async (username, password) => {
        try {
          const { user } = await api.register(username, password);
          // Fresh account: start at the cert picker with an empty working set.
          set({ user, authError: null, activeCert: null, history: [], flashProgress: {}, activeSession: null, lastResult: null });
          return true;
        } catch (e) {
          set({ authError: e instanceof Error ? e.message : 'Registration failed' });
          return false;
        }
      },

      login: async (username, password) => {
        try {
          const { user } = await api.login(username, password);
          // Clear any locally cached data from a previous session/user; the cert
          // picker + selectCert will hydrate the correct data from the server.
          set({ user, authError: null, activeCert: null, history: [], flashProgress: {}, activeSession: null, lastResult: null });
          return true;
        } catch (e) {
          set({ authError: e instanceof Error ? e.message : 'Login failed' });
          return false;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          /* ignore network errors on logout */
        }
        set({
          user: null,
          activeCert: null,
          history: [],
          flashProgress: {},
          activeSession: null,
          lastResult: null,
          authError: null,
        });
      },

      // ---- certification ----
      selectCert: async (cert) => {
        set({ activeCert: cert, hydrating: true });
        setActiveCert(cert);
        try {
          const { data } = await api.getProgress(cert);
          if (data) {
            set({
              history: (data.history as ExamResult[]) ?? [],
              flashProgress: (data.flashProgress as Record<string, CardProgress>) ?? {},
              activeSession: (data.activeSession as ExamSession | null) ?? null,
              lastResult: (data.lastResult as ExamResult | null) ?? null,
            });
          } else {
            set({ history: [], flashProgress: {}, activeSession: null, lastResult: null });
          }
        } catch {
          // Offline or transient error: fall back to whatever is cached locally.
        } finally {
          set({ hydrating: false });
        }
      },

      clearCert: () => set({ activeCert: null }),

      pushProgress: async () => {
        const s = get();
        if (!s.user || !s.activeCert) return;
        try {
          await api.putProgress(s.activeCert, {
            history: s.history,
            flashProgress: s.flashProgress as Record<string, unknown>,
            activeSession: s.activeSession,
            lastResult: s.lastResult,
          });
        } catch {
          /* transient errors are retried by the periodic sync loop */
        }
      },

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      toggleTheme: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'dark' ? 'light' : 'dark',
          },
        })),

      startExam: (config) => {
        const questionIds = generateExam(config);
        if (questionIds.length === 0) return null;
        const session: ExamSession = {
          id: `exam-${Date.now()}`,
          config,
          questionIds,
          responses: {},
          currentIndex: 0,
          startedAt: Date.now(),
          remainingSeconds: config.durationSeconds,
          status: 'in-progress',
        };
        set({ activeSession: session, lastResult: null });
        return session;
      },

      answerQuestion: (questionId, patch) =>
        set((state) => {
          if (!state.activeSession) return {};
          return {
            activeSession: {
              ...state.activeSession,
              responses: withResponse(state.activeSession.responses, questionId, patch),
            },
          };
        }),

      setCurrentIndex: (index) =>
        set((state) => {
          if (!state.activeSession) return {};
          const max = state.activeSession.questionIds.length - 1;
          const clamped = Math.max(0, Math.min(max, index));
          return { activeSession: { ...state.activeSession, currentIndex: clamped } };
        }),

      nextQuestion: () => {
        const s = get().activeSession;
        if (s) get().setCurrentIndex(s.currentIndex + 1);
      },

      prevQuestion: () => {
        const s = get().activeSession;
        if (s) get().setCurrentIndex(s.currentIndex - 1);
      },

      setConfidence: (questionId, confidence) =>
        get().answerQuestion(questionId, { confidence }),

      toggleBookmark: (questionId) =>
        set((state) => {
          if (!state.activeSession) return {};
          const cur = state.activeSession.responses[questionId];
          return {
            activeSession: {
              ...state.activeSession,
              responses: withResponse(state.activeSession.responses, questionId, {
                bookmarked: !cur?.bookmarked,
              }),
            },
          };
        }),

      toggleFlag: (questionId) =>
        set((state) => {
          if (!state.activeSession) return {};
          const cur = state.activeSession.responses[questionId];
          return {
            activeSession: {
              ...state.activeSession,
              responses: withResponse(state.activeSession.responses, questionId, {
                flagged: !cur?.flagged,
              }),
            },
          };
        }),

      tickTimer: (remainingSeconds) =>
        set((state) => {
          if (!state.activeSession) return {};
          return { activeSession: { ...state.activeSession, remainingSeconds } };
        }),

      addTimeSpent: (questionId, seconds) =>
        set((state) => {
          if (!state.activeSession) return {};
          const cur = state.activeSession.responses[questionId];
          return {
            activeSession: {
              ...state.activeSession,
              responses: withResponse(state.activeSession.responses, questionId, {
                timeSpent: (cur?.timeSpent ?? 0) + seconds,
              }),
            },
          };
        }),

      submitExam: () => {
        const state = get();
        if (!state.activeSession) return null;
        const submitted: ExamSession = {
          ...state.activeSession,
          status: 'submitted',
          submittedAt: Date.now(),
        };
        const result = gradeSession(submitted);
        set({
          activeSession: null,
          lastResult: result,
          history: [...state.history, result],
        });
        return result;
      },

      abandonExam: () => set({ activeSession: null }),

      reviewFlashcard: (cardId, success) =>
        set((state) => {
          const prev = state.flashProgress[cardId] ?? initialProgress(cardId);
          return {
            flashProgress: { ...state.flashProgress, [cardId]: reviewCard(prev, success) },
          };
        }),

      resetAllProgress: () => {
        set({
          history: [],
          flashProgress: {},
          activeSession: null,
          lastResult: null,
        });
        // Immediately persist the cleared state for the active cert.
        void get().pushProgress();
      },

      exportData: () => {
        const { settings, history, flashProgress } = get();
        return JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), settings, history, flashProgress },
          null,
          2,
        );
      },

      importData: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<{
            settings: Settings;
            history: ExamResult[];
            flashProgress: Record<string, CardProgress>;
          }>;
          set((state) => ({
            settings: { ...state.settings, ...(parsed.settings ?? {}) },
            history: Array.isArray(parsed.history) ? parsed.history : state.history,
            flashProgress:
              parsed.flashProgress && typeof parsed.flashProgress === 'object'
                ? parsed.flashProgress
                : state.flashProgress,
          }));
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      // Persist the working set + identity as a local cache. The server remains
      // the source of truth and overwrites this on login/cert-select.
      partialize: (state) => ({
        user: state.user,
        activeCert: state.activeCert,
        settings: state.settings,
        history: state.history,
        flashProgress: state.flashProgress,
        activeSession: state.activeSession,
        lastResult: state.lastResult,
      }),
    },
  ),
);
