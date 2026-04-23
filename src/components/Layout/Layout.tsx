import React from 'react';
import { Outlet } from 'react-router-dom';
import { RuntimeStatusBanner } from './RuntimeStatusBanner';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => (
  <div className="flex h-screen bg-theme-bg-primary text-theme-text-primary">
    <Sidebar />
    <main className="flex-1 overflow-auto p-6">
      <RuntimeStatusBanner />
      <Outlet />
    </main>
  </div>
);
