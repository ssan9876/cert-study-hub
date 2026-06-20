// ExamPage — the exam controller. With no active session it shows the exam
// setup form; once a session exists it runs the exam: question presentation
// (including the case study layout), countdown timer, per-question time
// tracking, keyboard shortcuts, the question palette, and navigation.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useExam } from '../../hooks/useExam';
import { useTimer } from '../../hooks/useTimer';
import { defaultConfig, EXAM_LENGTHS } from '../../services/ExamGenerator';
import { getDomains, getCaseStudyById, isAnswered } from '../../services/QuestionService';
import { QuestionCard } from '../../components/Exam/QuestionCard';
import { ExamControls } from '../../components/Exam/ExamControls';
import { CaseStudyLayout } from '../../components/CaseStudy/CaseStudyLayout';
import { QuestionPalette } from '../../components/QuestionPalette/QuestionPalette';
import { Timer } from '../../components/Timer/Timer';
import { Card } from '../../components/common/ui';
import type { DomainName, Difficulty } from '../../types/Question';
import type { ExamLength } from '../../types/Exam';

// ---------------------------------------------------------------------------
// Setup form (shown when there is no active exam session)
// ---------------------------------------------------------------------------
function ExamSetup() {
  const navigate = useNavigate();
  const startExam = useAppStore((s) => s.startExam);
  const timerEnabled = useAppStore((s) => s.settings.timerEnabled);
  const domains = getDomains();

  const [length, setLength] = useState<ExamLength>(40);
  const [timed, setTimed] = useState(true);
  const [selectedDomains, setSelectedDomains] = useState<DomainName[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [includeCaseStudies, setIncludeCaseStudies] = useState(true);

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const begin = () => {
    const base = defaultConfig(length, timed && timerEnabled);
    startExam({
      ...base,
      domains: selectedDomains,
      difficulties,
      includeCaseStudies,
    });
    navigate('/exam');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configure your exam</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Questions are drawn to match the official AZ-104 domain weighting.
        </p>
      </header>

      <Card className="space-y-6 p-6">
        {/* Length */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Number of questions
          </p>
          <div className="grid grid-cols-4 gap-2">
            {EXAM_LENGTHS.map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setLength(len)}
                className={`rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                  length === len
                    ? 'border-azure-500 bg-azure-500/10 text-azure-600 dark:text-azure-300'
                    : 'border-slate-200 text-slate-600 hover:border-azure-400 dark:border-navy-600 dark:text-slate-300'
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        {/* Domains */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Domains <span className="font-normal text-slate-400">(none = all, weighted)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => toggle(selectedDomains, d.name, setSelectedDomains)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedDomains.includes(d.name)
                    ? 'border-azure-500 bg-azure-500 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-azure-400 dark:border-navy-600 dark:text-slate-300'
                }`}
              >
                {d.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Difficulty <span className="font-normal text-slate-400">(none = all)</span>
          </p>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(difficulties, d, setDifficulties)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  difficulties.includes(d)
                    ? 'border-azure-500 bg-azure-500 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-azure-400 dark:border-navy-600 dark:text-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="h-4 w-4 accent-azure-500"
            />
            Timed exam
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={includeCaseStudies}
              onChange={(e) => setIncludeCaseStudies(e.target.checked)}
              className="h-4 w-4 accent-azure-500"
            />
            Include case study questions
          </label>
        </div>

        <button
          type="button"
          onClick={begin}
          className="w-full rounded-lg bg-azure-600 py-3 text-sm font-bold text-white transition-colors hover:bg-azure-500"
        >
          Start exam →
        </button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Running exam
// ---------------------------------------------------------------------------
function ExamRunner() {
  const navigate = useNavigate();
  const instantFeedback = useAppStore((s) => s.settings.instantFeedback);
  const timerEnabled = useAppStore((s) => s.settings.timerEnabled);
  const {
    session,
    questions,
    counts,
    currentQuestion,
    currentResponse,
    answerQuestion,
    setCurrentIndex,
    nextQuestion,
    prevQuestion,
    setConfidence,
    toggleBookmark,
    toggleFlag,
    addTimeSpent,
    tickTimer,
    submitExam,
  } = useExam();

  const [showPalette, setShowPalette] = useState(false);
  // Capture the starting remaining time ONCE (using the persisted value, which
  // makes resume-after-refresh work) so the per-tick persistence does not
  // continuously re-seed the countdown.
  const [initialRemaining] = useState(() => session?.remainingSeconds ?? 0);

  const timed = !!session && session.config.durationSeconds > 0 && timerEnabled;

  // Submit and go to results.
  const finish = () => {
    submitExam();
    navigate('/results');
  };

  // Countdown timer for timed exams; auto-submits on expiry.
  const { remaining } = useTimer({
    initialSeconds: initialRemaining,
    active: timed,
    onExpire: finish,
    onTick: (r) => tickTimer(r),
  });

  // Per-question time tracking: accrue elapsed seconds to the question that was
  // visible when the index (or question) changes or the component unmounts.
  const trackRef = useRef<{ id: string; start: number } | null>(null);
  useEffect(() => {
    // Flush the previously tracked question.
    const prev = trackRef.current;
    if (prev) {
      const elapsed = Math.round((Date.now() - prev.start) / 1000);
      if (elapsed > 0) addTimeSpent(prev.id, elapsed);
    }
    trackRef.current = currentQuestion ? { id: currentQuestion.id, start: Date.now() } : null;
    return () => {
      const cur = trackRef.current;
      if (cur) {
        const elapsed = Math.round((Date.now() - cur.start) / 1000);
        if (elapsed > 0) addTimeSpent(cur.id, elapsed);
        trackRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  // Keyboard shortcuts: A–F select, N/P navigate, B bookmark, F flag.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const key = e.key.toLowerCase();

      if (key === 'n') return void nextQuestion();
      if (key === 'p') return void prevQuestion();
      if (key === 'b') return void toggleBookmark(currentQuestion.id);
      if (key === 'f') return void toggleFlag(currentQuestion.id);

      // Letter answers for choice-based questions.
      const choiceTypes = ['single', 'casestudy', 'multi', 'choose2', 'choose3'];
      if (choiceTypes.includes(currentQuestion.type)) {
        const idx = 'abcdef'.indexOf(key);
        const answer = currentQuestion.answers?.[idx];
        if (answer) {
          if (currentQuestion.type === 'single' || currentQuestion.type === 'casestudy') {
            answerQuestion(currentQuestion.id, { selected: [answer.id] });
          } else {
            const cur = currentResponse?.selected ?? [];
            const cap = currentQuestion.type === 'choose2' ? 2 : currentQuestion.type === 'choose3' ? 3 : Infinity;
            if (cur.includes(answer.id)) {
              answerQuestion(currentQuestion.id, { selected: cur.filter((x) => x !== answer.id) });
            } else if (cur.length < cap) {
              answerQuestion(currentQuestion.id, { selected: [...cur, answer.id] });
            }
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, currentResponse]);

  if (!session || !currentQuestion) return null;

  const index = session.currentIndex;
  const answered = isAnswered(currentQuestion, currentResponse);
  const showFeedback = instantFeedback && session.config.mode === 'practice' && answered;
  const caseStudy = currentQuestion.caseStudyId
    ? getCaseStudyById(currentQuestion.caseStudyId)
    : undefined;

  const card = (
    <QuestionCard
      question={currentQuestion}
      response={currentResponse}
      index={index}
      total={questions.length}
      onRespond={(patch) => answerQuestion(currentQuestion.id, patch)}
      onToggleBookmark={() => toggleBookmark(currentQuestion.id)}
      onToggleFlag={() => toggleFlag(currentQuestion.id)}
      onSetConfidence={(v) => setConfidence(currentQuestion.id, v)}
      showFeedback={showFeedback}
      compact={!!caseStudy}
    />
  );

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Practice Exam</h1>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {counts.answered}/{counts.total} answered
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timed && <Timer remaining={remaining} total={session.config.durationSeconds} />}
          <button
            type="button"
            onClick={() => setShowPalette((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800 lg:hidden"
          >
            {showPalette ? 'Hide' : 'Palette'}
          </button>
        </div>
      </div>

      {/* Mobile palette drawer */}
      {showPalette && (
        <Card className="p-4 lg:hidden">
          <QuestionPalette
            questions={questions}
            responses={session.responses}
            currentIndex={index}
            onJump={(i) => {
              setCurrentIndex(i);
              setShowPalette(false);
            }}
          />
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        {/* Main question column */}
        <div className="space-y-5">
          {caseStudy ? (
            <CaseStudyLayout
              caseStudy={caseStudy}
              questionNumberLabel={`Question ${index + 1} of ${questions.length}`}
            >
              {card}
            </CaseStudyLayout>
          ) : (
            <Card className="p-6">{card}</Card>
          )}

          <ExamControls
            index={index}
            total={questions.length}
            answered={counts.answered}
            onPrev={prevQuestion}
            onNext={nextQuestion}
            onReview={() => navigate('/review')}
          />
        </div>

        {/* Desktop palette */}
        <div className="hidden lg:block">
          <Card className="sticky top-6 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Question palette
            </h3>
            <QuestionPalette
              questions={questions}
              responses={session.responses}
              currentIndex={index}
              onJump={(i) => setCurrentIndex(i)}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ExamPage() {
  const hasSession = useAppStore((s) => !!s.activeSession);
  return hasSession ? <ExamRunner /> : <ExamSetup />;
}
