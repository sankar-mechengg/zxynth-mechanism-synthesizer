import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAppStore from './stores/useAppStore';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import EducationSidebar from './components/education/EducationSidebar';
import Landing from './pages/Landing';
import PathSynthesis from './pages/PathSynthesis';
import FunctionSynthesis from './pages/FunctionSynthesis';
import MotionSynthesis from './pages/MotionSynthesis';
import Results from './pages/Results';

export default function App() {
  const { theme, initTheme } = useAppStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/path" element={<PathSynthesis />} />
          <Route path="/function" element={<FunctionSynthesis />} />
          <Route path="/motion" element={<MotionSynthesis />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </main>
      <Footer />
      <EducationSidebar />
    </div>
  );
}
