import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Inicio', roles: ['Admin', 'Preceptor', 'Student'] },
    { path: '/asistencia', label: 'Tomar Asistencia', roles: ['Admin', 'Preceptor'] },
    { path: '/novedades', label: 'Novedades', roles: ['Admin', 'Preceptor', 'Student'] },
    { path: '/admin', label: 'Admin', roles: ['Admin'] },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium';

  return (
    <header className="bg-gray-800 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-white font-bold text-xl">
              Asistencia
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map(item => (
                  user && item.roles.includes(user.role) &&
                  <NavLink key={item.path} to={item.path} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          {user && (
            <div className="flex items-center">
              <span className="text-gray-300 mr-4 hidden sm:block">Hola, {user.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};
