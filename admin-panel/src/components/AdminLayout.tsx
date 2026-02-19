import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Settings, 
  Image, 
  DollarSign, 
  Users, 
  FileText, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Evento', href: '/evento', icon: Settings },
  { name: 'Obras', href: '/obras', icon: Image },
  { name: 'Pagos', href: '/pagos', icon: DollarSign },
  { name: 'Usuarios', href: '/usuarios', icon: Users },
  { name: 'Reportes', href: '/reportes', icon: FileText },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <span className="text-xl font-bold text-primary-600">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent router={router} onLogout={logout} />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          <div className="flex items-center h-16 px-4 border-b">
            <span className="text-xl font-bold text-primary-600">Admin Panel</span>
          </div>
          <SidebarContent router={router} onLogout={logout} />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b shadow-sm">
          <button
            type="button"
            className="px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center justify-between flex-1 px-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === router.pathname)?.name || 'Dashboard'}
            </h2>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.nombre}</span>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

interface SidebarContentProps {
  router: any;
  onLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ router, onLogout }) => {
  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = router.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
              ${isActive 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <Icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        );
      })}
      
      <button
        onClick={onLogout}
        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors mt-4"
      >
        <LogOut className="w-5 h-5 mr-3" />
        Cerrar Sesión
      </button>
    </nav>
  );
};
