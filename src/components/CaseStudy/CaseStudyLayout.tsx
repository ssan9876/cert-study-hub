// CaseStudyLayout — replicates the real Microsoft exam case study layout:
//   • a persistent LEFT navigation listing every scenario tab,
//   • a persistent RIGHT pane showing the selected scenario section,
//   • the question itself in the CENTER pane (passed as children).
// On narrow screens the three panes stack vertically.

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { CaseStudy } from '../../types/CaseStudy';
import { Card } from '../common/ui';

/** Render a scenario body: blank lines split paragraphs, `- ` lines are bullets. */
function ScenarioBody({ body }: { body: string }) {
  const blocks = body.split('\n').filter((line) => line.trim().length > 0);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      {blocks.map((line, i) =>
        line.trimStart().startsWith('- ') ? (
          <li key={i} className="ml-5 list-disc">
            {line.trim().slice(2)}
          </li>
        ) : (
          <p key={i}>{line}</p>
        ),
      )}
    </div>
  );
}

export function CaseStudyLayout({
  caseStudy,
  questionNumberLabel,
  children,
}: {
  caseStudy: CaseStudy;
  questionNumberLabel?: string;
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState(caseStudy.sections[0]?.id ?? '');
  const active = caseStudy.sections.find((s) => s.id === activeId) ?? caseStudy.sections[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr_minmax(280px,360px)]">
      {/* LEFT: scenario tab navigation */}
      <Card className="h-fit overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-navy-700 dark:bg-navy-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Case Study
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{caseStudy.title}</p>
        </div>
        <nav className="flex flex-col p-2">
          {caseStudy.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                s.id === activeId
                  ? 'bg-azure-500/10 font-semibold text-azure-600 dark:text-azure-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>
      </Card>

      {/* CENTER: the question */}
      <Card className="order-last p-5 lg:order-none">
        {questionNumberLabel && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-azure-600 dark:text-azure-300">
            {questionNumberLabel}
          </p>
        )}
        {children}
      </Card>

      {/* RIGHT: the selected scenario section */}
      <Card className="h-fit p-4">
        <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-white">{active?.title}</h3>
        {active && <ScenarioBody body={active.body} />}
      </Card>
    </div>
  );
}
