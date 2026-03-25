import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { MenuEditor } from './pages/MenuEditor';
import { Profiles } from './pages/Profiles';
import { GlobalSettings } from './pages/GlobalSettings';
import { useSettingsStore } from './stores/settingsStore';
import type { AppTheme } from './types/settings';

function applyThemeClass(theme: AppTheme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

const App: React.FC = () => {
  const theme = useSettingsStore((s) => s.settings?.global.theme ?? 'dark');

  useEffect(() => {
    applyThemeClass(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyThemeClass('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/menu/:id" element={<MenuEditor />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/settings" element={<GlobalSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
