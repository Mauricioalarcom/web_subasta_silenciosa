import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  DollarSign, 
  Image, 
  TrendingUp, 
  Users 
} from 'lucide-react';

export default function DashboardPage() {
  // TODO: Obtener datos reales de la API
  const stats = [
    {
      name: 'Total Recaudado',
      value: '$0.00',
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+0%',
    },
    {
      name: 'Obras Activas',
      value: '3',
      icon: Image,
      color: 'bg-blue-500',
      change: '3 publicadas',
    },
    {
      name: 'Total Ofertas',
      value: '0',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: 'Sin ofertas',
    },
    {
      name: 'Participantes',
      value: '1',
      icon: Users,
      color: 'bg-orange-500',
      change: '1 admin',
    },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Bienvenida */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Bienvenido al panel de administración de la subasta silenciosa
            </p>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="card">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${stat.color} rounded-lg p-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">{stat.change}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Información del evento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del evento actual */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Evento Actual
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">Subasta de Arte Contemporáneo 2026</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Organización</p>
                  <p className="font-medium">Galería Arte & Cultura</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de inicio</p>
                  <p className="font-medium">01 Mar 2026, 18:00</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de cierre</p>
                  <p className="font-medium">15 Mar 2026, 22:00</p>
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Próximamente
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h2>
              <div className="space-y-3">
                <button className="w-full btn-primary text-left flex items-center justify-between">
                  <span>Crear Nueva Obra</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button className="w-full btn-secondary text-left flex items-center justify-between">
                  <span>Configurar Evento</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button className="w-full btn-secondary text-left flex items-center justify-between">
                  <span>Ver Reportes</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de inicio */}
          <div className="mt-8 card bg-blue-50 border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  ¡Bienvenido al Panel de Administración!
                </h3>
                <div className="mt-2 text-sm text-blue-800">
                  <p>
                    Este es el checkpoint inicial del panel de administración. 
                    Ya tienes configurado:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Base de datos con tablas creadas</li>
                    <li>Sistema de autenticación</li>
                    <li>Usuario administrador (admin@subasta.com / admin123)</li>
                    <li>Evento y obras de ejemplo</li>
                  </ul>
                  <p className="mt-2">
                    En los siguientes checkpoints implementaremos la gestión completa 
                    de obras, pagos, y todas las funcionalidades del panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
