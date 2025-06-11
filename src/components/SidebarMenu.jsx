import React from 'react';
import { menuItems } from '../menu';

export default function SidebarMenu({ activeMenu, setActiveMenu, setActiveTab, sidebarCollapsed, user }) {
  return (
    <nav>
      {menuItems
        .filter(item => !item.adminOnly || (user && user.role === 'admin'))
        .map(item => (
          <button
            key={item.id}
            className={`w-full flex items-center px-4 py-3 hover:bg-green-700 transition ${activeMenu === item.id ? 'bg-green-800' : ''}`}
            onClick={() => setActiveMenu(item.id)}
          >
            <item.icon className="w-5 h-5 mr-2" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
    </nav>
  );
}
