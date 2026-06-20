// SettingsPage — preferences and data management.

import { SettingsPanel } from '../../components/Settings/SettingsPanel';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customize the look and behavior of CertStudyHub. Everything is stored locally.
        </p>
      </header>
      <SettingsPanel />
    </div>
  );
}
