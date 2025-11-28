import { Navigate, Route, Routes } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import { Toaster } from './components/common/Toast';
import Footer from './components/common/Footer';
import { motion } from 'framer-motion';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <motion.div
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
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
