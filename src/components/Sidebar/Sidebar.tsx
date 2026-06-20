// Sidebar — primary navigation. Always visible on desktop (left rail) and
// rendered as a bottom tab bar on mobile. The rail also shows the active
// certification, the signed-in user, and switch-cert / sign-out controls.

import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getActiveCertMeta } from '../../services/QuestionService';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '▣' },
  { to: '/exam', label: 'Exam', icon: '✎' },
  { to: '/flashcards', label: 'Flashcards', icon: '🂠' },
  { to: '/statistics', label: 'Statistics', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar({ variant = 'rail' }: { variant?: 'rail' | 'bottom' }) {
  const user = useAppStore((s) => s.user);
  const clearCert = useAppStore((s) => s.clearCert);
  const logout = useAppStore((s) => s.logout);
  const meta = getActiveCertMeta();

  if (variant === 'bottom') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 backdrop-blur dark:border-navy-700 dark:bg-navy-900/95 md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-azure-600 dark:text-azure-300' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <aside className="hidden w-60 flex-none flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-navy-700 dark:bg-navy-900 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: meta.accent }}
        >
          {meta.vendor.slice(0, 2)}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-800 dark:text-white">{meta.shortName}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{meta.exam}</p>
        </div>
      </div>

      {/* Switch certification */}
      <button
        type="button"
        onClick={clearCert}
        className="mb-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-azure-400 hover:text-azure-600 dark:border-navy-700 dark:text-slate-400"
      >
        ⇄ Switch certification
      </button>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-azure-500/10 text-azure-600 dark:text-azure-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 dark:bg-navy-800 dark:text-slate-400">
          Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.username}</span>. Progress syncs to your account.
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-navy-700 dark:text-slate-400"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
