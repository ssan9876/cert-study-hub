// CertPickerPage — shown after login when no certification is selected. Lets the
// user choose which certification hub to enter. Selecting one hydrates that
// cert's progress from the server and reveals the study app.

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { listCertMeta } from '../../data/certRegistry';

export function CertPickerPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const selectCert = useAppStore((s) => s.selectCert);
  const logout = useAppStore((s) => s.logout);
  const certs = listCertMeta();

  const choose = async (id: (typeof certs)[number]['id']) => {
    await selectCert(id);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-navy-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome, {user?.username}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose a certification to study. Each hub tracks its own progress.
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
          >
            Sign out
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {certs.map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="group rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition-colors hover:border-azure-400 dark:border-navy-700 dark:bg-navy-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: c.accent }}
                >
                  {c.exam}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{c.vendor}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-azure-600 dark:text-white">
                {c.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
              <p className="mt-4 text-sm font-semibold text-azure-600 dark:text-azure-300">
                Enter hub →
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
