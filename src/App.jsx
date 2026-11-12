import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Splash from './components/Splash.jsx';
import GeneratePage from './pages/GeneratePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
 import TodayPage from './pages/TodayPage.jsx';
 import PicksPage from './pages/PicksPage.jsx';

const THEME_KEY = 'ssq-oracle.theme';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  // 暗堂为默认主题，用户选择持久化
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage 不可用（如隐私模式）则静默降级
    }
  }, [theme]);

  return (
    <div className="app-shell">
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <NavBar theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      <Routes>
         <Route path="/today" element={<TodayPage />} />
         <Route path="/picks" element={<PicksPage />} />
        <Route path="/" element={<Navigate to="/generate" replace />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/generate" replace />} />
      </Routes>
      <footer className="disclaimer">
        本平台所有「预测」结果由算法随机生成，仅供娱乐，不构成任何购彩建议。
        彩票开奖为独立随机事件，请理性购彩，量力而行。
      </footer>
    </div>
  );
}
