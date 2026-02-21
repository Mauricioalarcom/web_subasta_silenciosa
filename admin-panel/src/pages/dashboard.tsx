import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';
import { 
  DollarSign, 
  Image, 
  TrendingUp, 
  Users,
  Activity,
  Award,
  Clock,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  recaudado: {
    total: number;
    cambio: string;
  };
  obras: {
    activas: number;
    vendidas: number;
    no_vendidas: number;
    pausadas: number;
    total: number;
  };
  ofertas: {
    total: number;
    activas: number;
    superadas: number;
    ganadoras: number;
    promedio: number;
  };
  usuarios: {
    total: number;
    cambio: string;
  };
  conversion: {
    tasa: string;
    descripcion: string;
  };
}

interface TopObra {
  id: string;
  nombre: string;
  artista: string;
  imagen_principal: string;
  precio_base: number;
  precio_actual: number;
  numero_ofertas: number;
  incremento_total: number;
  estado: string;
}

interface LiveStats {
  ofertasUltimaHora: number;
  ofertasUltimos5Min: number;
  obrasConActividad: number;
  obrasCerrandoPronto: number;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topObras, setTopObras] = useState<TopObra[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { isConnected } = useWebSocket();

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboard();
    loadTopObras();
    loadLiveStats();

    // Actualizar stats en vivo cada 30 segundos
    const interval = setInterval(() => {
      loadLiveStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get('/api/admin/analytics/dashboard');
      
      if (response.data.success) {
        setStats(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (error: any) {
      console.error('Error al cargar dashboard:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadTopObras = async () => {
    try {
      const response = await authAPI.get('/api/admin/analytics/top-obras');
      
      if (response.data.success) {
        setTopObras(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar top obras:', error);
    }
  };

  const loadLiveStats = async () => {
    try {
      const response = await authAPI.get('/api/admin/analytics/live');
      
      if (response.data.success) {
        setLiveStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar live stats:', error);
    }
  };

  if (loading || !stats) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const mainStats = [
    {
      name: 'Total Recaudado',
      value: `S/ ${stats.recaudado.total.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: stats.recaudado.cambio,
      trend: 'up'
    },
    {
      name: 'Obras Activas',
      value: stats.obras.activas.toString(),
      icon: Image,
      color: 'bg-blue-500',
      change: `${stats.obras.total} total`,
      trend: 'neutral'
    },
    {
      name: 'Total Ofertas',
      value: stats.ofertas.total.toString(),
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: `S/ ${stats.ofertas.promedio.toFixed(2)} promedio`,
      trend: 'up'
    },
    {
      name: 'Participantes',
      value: stats.usuarios.total.toString(),
      icon: Users,
      color: 'bg-orange-500',
      change: stats.usuarios.cambio,
      trend: 'up'
    },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header con indicador de conexión */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">
                  Panel de administración en tiempo real
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Indicador WebSocket */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-600 animate-pulse' : 'bg-red-600'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {isConnected ? 'En vivo' : 'Desconectado'}
                  </span>
                </div>
                {/* Botón refrescar */}
                <button
                  onClick={loadDashboard}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Última actualización: {lastUpdate.toLocaleTimeString('es-PE')}
            </p>
          </div>

          {/* Estadísticas en tiempo real */}
          {liveStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Última hora</p>
                    <p className="text-2xl font-bold text-purple-900">{liveStats.ofertasUltimaHora}</p>
                    <p className="text-xs text-purple-600">ofertas</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Últimos 5 min</p>
                    <p className="text-2xl font-bold text-green-900">{liveStats.ofertasUltimos5Min}</p>
                    <p className="text-xs text-green-600">ofertas</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Con actividad</p>
                    <p className="text-2xl font-bold text-blue-900">{liveStats.obrasConActividad}</p>
                    <p className="text-xs text-blue-600">obras</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Cierran pronto</p>
                    <p className="text-2xl font-bold text-orange-900">{liveStats.obrasCerrandoPronto}</p>
                    <p className="text-xs text-orange-600">&lt;1 hora</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tarjetas de estadísticas principales */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {mainStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="card hover:shadow-lg transition-shadow">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top 5 Obras con más ofertas */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top Obras
                </h2>
                <Link href="/obras" className="text-sm text-purple-600 hover:underline">
                  Ver todas
                </Link>
              </div>

              {topObras.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay obras con ofertas aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topObras.map((obra, idx) => (
                    <Link
                      key={obra.id}
                      href={`/obras/${obra.id}/editar`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        {obra.imagen_principal ? (
                          <img
                            src={`http://localhost:4000${obra.imagen_principal}`}
                            alt={obra.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{obra.nombre}</p>
                        <p className="text-sm text-gray-500 truncate">{obra.artista}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          S/ {parseFloat(obra.precio_actual.toString()).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{obra.numero_ofertas} ofertas</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen de conversión */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Resumen de Actividad
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Conversión</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.conversion.tasa}%</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.conversion.descripcion}</p>
                  </div>
                  <div className="w-20 h-20">
                    <svg viewBox="0 0 36 36" className="transform -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="3"
                        strokeDasharray={`${parseFloat(stats.conversion.tasa)} ${100 - parseFloat(stats.conversion.tasa)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">Vendidas</p>
                    <p className="text-xl font-bold text-blue-600">{stats.obras.vendidas}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">Ganadoras</p>
                    <p className="text-xl font-bold text-green-600">{stats.ofertas.ganadoras}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600">Activas</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.ofertas.activas}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Superadas</p>
                    <p className="text-xl font-bold text-gray-600">{stats.ofertas.superadas}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/obras/nueva" className="btn-primary text-center">
                Crear Nueva Obra
              </Link>
              <Link href="/subastas" className="btn-secondary text-center">
                Ver Subastas Activas
              </Link>
              <Link href="/pagos" className="btn-secondary text-center">
                Gestionar Pagos
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
