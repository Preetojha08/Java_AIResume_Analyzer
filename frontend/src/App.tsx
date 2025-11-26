import { Navigate, Route, Routes } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import { Toaster } from './components/common/Toast';
import Footer from './components/common/Footer';
import { motion } from 'framer-motion';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <motion.div
        className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary-600">AI powered</p>
              <h1 className="text-3xl font-bold sm:text-4xl">Resume ATS Analyzer</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Upload a PDF to see how it scores against modern Applicant Tracking Systems. Get instant skills, role fit,
                and keyword insights with a Gemini-backed engine.
              </p>
            </div>
            <div className="hidden rounded-full bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-floating sm:flex">
              Live preview
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analysis/:resumeId" element={<AnalysisPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </motion.div>
      <Toaster />
    </div>
  );
};

export default App;
