'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  Gavel, 
  Heart, 
  User, 
  LogOut, 
  LogIn,
  Home,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors">
              <Gavel className="w-8 h-8" />
              <span className="font-bold text-xl hidden sm:block">Subasta Silenciosa</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Galería</span>
            </Link>

            {status === 'authenticated' ? (
              <>
                <Link 
                  href="/favoritos" 
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>Favoritos</span>
                </Link>

                <Link 
                  href="/perfil" 
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Mi Perfil</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Salir</span>
                </button>

                {/* User info */}
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Usuario'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      {session.user?.name || session.user?.email}
                    </span>
                    {session.user?.isAdmin && (
                      <span className="text-xs text-purple-600 font-semibold">
                        👑 Administrador
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-purple-600"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 py-2"
            >
              <Home className="w-5 h-5" />
              <span>Galería</span>
            </Link>

            {status === 'authenticated' ? (
              <>
                <Link 
                  href="/favoritos" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 py-2"
                >
                  <Heart className="w-5 h-5" />
                  <span>Favoritos</span>
                </Link>

                <Link 
                  href="/perfil" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 py-2"
                >
                  <User className="w-5 h-5" />
                  <span>Mi Perfil</span>
                </Link>

                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 py-2 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Salir</span>
                </button>

                {/* User info mobile */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Usuario'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
