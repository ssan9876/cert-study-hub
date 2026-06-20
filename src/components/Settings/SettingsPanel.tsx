// SettingsPanel — user preferences and data management. All state lives in the
// persisted Zustand store, so changes survive refreshes. Includes theme, timer,
// font size, instant feedback, reset-with-confirmation, and JSON export/import.

import { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../common/ui';
import type { Settings } from '../../types/Exam';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-slate-800 dark:text-white">{label}</span>
        {description && (
          <span className="block text-xs text-slate-400 dark:text-slate-500">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-none rounded-full transition-colors ${
          checked ? 'bg-azure-500' : 'bg-slate-300 dark:bg-navy-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAllProgress = useAppStore((s) => s.resetAllProgress);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);

  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fontOptions: { value: Settings['fontScale']; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cert-study-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      setImportMsg(ok ? 'Data imported successfully.' : 'Import failed: invalid file.');
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Appearance */}
      <Card className="px-5 py-2">
        <h2 className="border-b border-slate-200 py-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:border-navy-700 dark:text-slate-400">
          Appearance
        </h2>
        <Toggle
          label="Dark mode"
          description="Switch between the dark navy theme and a light theme."
          checked={settings.theme === 'dark'}
          onChange={(v) => updateSettings({ theme: v ? 'dark' : 'light' })}
        />
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 py-3 dark:border-navy-700">
          <span>
            <span className="block text-sm font-semibold text-slate-800 dark:text-white">
              Font size
            </span>
            <span className="block text-xs text-slate-400 dark:text-slate-500">
              Affects question and card text.
            </span>
          </span>
          <div className="flex gap-1 rounded-lg border border-slate-300 p-1 dark:border-navy-600">
            {fontOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => updateSettings({ fontScale: o.value })}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  settings.fontScale === o.value
                    ? 'bg-azure-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Exam behavior */}
      <Card className="px-5 py-2">
        <h2 className="border-b border-slate-200 py-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:border-navy-700 dark:text-slate-400">
          Exam behavior
        </h2>
        <Toggle
          label="Enable timer"
          description="Show a countdown timer during timed exams."
          checked={settings.timerEnabled}
          onChange={(v) => updateSettings({ timerEnabled: v })}
        />
        <div className="border-t border-slate-200 dark:border-navy-700">
          <Toggle
            label="Instant feedback (practice)"
            description="Reveal the correct answer and explanation immediately after answering."
            checked={settings.instantFeedback}
            onChange={(v) => updateSettings({ instantFeedback: v })}
          />
        </div>
      </Card>

      {/* Data management */}
      <Card className="px-5 py-2">
        <h2 className="border-b border-slate-200 py-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:border-navy-700 dark:text-slate-400">
          Data
        </h2>
        <div className="flex flex-wrap gap-3 py-4">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-200 dark:hover:bg-navy-800"
          >
            Export all data
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-200 dark:hover:bg-navy-800"
          >
            Import data
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {importMsg && (
          <p className="pb-3 text-xs font-medium text-azure-600 dark:text-azure-300">{importMsg}</p>
        )}

        <div className="border-t border-slate-200 py-4 dark:border-navy-700">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              Reset all progress
            </button>
          ) : (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 dark:border-rose-700 dark:bg-rose-500/10">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                This permanently deletes all exam history and flashcard progress. This cannot be
                undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAllProgress();
                    setConfirmReset(false);
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
                >
                  Yes, delete everything
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
