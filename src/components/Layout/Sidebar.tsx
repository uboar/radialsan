import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Menus', icon: '◎' },
  { to: '/profiles', label: 'Profiles', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export const Sidebar: React.FC = () => (
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
