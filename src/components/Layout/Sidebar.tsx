import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.menus'), icon: '◎' },
    { to: '/profiles', label: t('nav.profiles'), icon: '👤' },
    { to: '/settings', label: t('nav.settings'), icon: '⚙' },
  ];

  return (
    <nav className="w-56 min-h-screen bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-1">
      <h1 className="text-lg font-bold text-white mb-6 px-2">radialsan</h1>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`
          }
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
