import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { MenuEditor } from './pages/MenuEditor';
import { Profiles } from './pages/Profiles';
import { GlobalSettings } from './pages/GlobalSettings';

const App: React.FC = () => (
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

export default App;
