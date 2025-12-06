import { Navigate, Route, Routes } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import { Toaster } from './components/common/Toast';
import Footer from './components/common/Footer';
import Logo from './components/common/Logo';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const App = () => {
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    if (theme === 'dark') root.classList.add('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const themeLabel = useMemo(() => (theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'), [theme]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <motion.div
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <button
            onClick={toggleTheme}
            aria-label={themeLabel}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </header>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analysis/:resumeId" element={<AnalysisPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
      <Footer />
      <Toaster />
    </div>
  );
};

export default App;
