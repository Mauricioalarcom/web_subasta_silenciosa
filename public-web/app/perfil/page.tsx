'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Countdown } from '@/components/Countdown';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  User,
  Mail,
  Calendar,
  Gavel,
  Trophy,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Oferta {
  id: string;
  monto: number;
  fecha_oferta: string;
  estado: 'ACTIVA' | 'GANADORA' | 'PERDIDA' | 'RECHAZADA';
  obra_id: string;
  obra_nombre: string;
  obra_artista: string;
  obra_imagen: string;
  obra_precio_actual: number;
  obra_fecha_cierre: string;
  obra_estado: string;
}

interface Estadisticas {
  total_ofertas: number;
  ofertas_activas: number;
  ofertas_ganadas: number;
  ofertas_perdidas: number;
  monto_total_ofertado: number;
  tasa_exito: number;
}

function PerfilPage() {
  const { data: session } = useSession();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'ganadas' | 'perdidas'>('todas');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = session?.user?.accessToken;
        if (!token) return;

      // Cargar ofertas y estadísticas en paralelo
      const [ofertasRes, statsRes] = await Promise.all([
        fetch('http://localhost:4000/api/ofertas/mis-ofertas', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch('http://localhost:4000/api/ofertas/mis-estadisticas', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      ]);

      if (ofertasRes.ok) {
        const ofertasData = await ofertasRes.json();
        setOfertas(ofertasData.data);
      }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setEstadisticas(statsData.data);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.accessToken) {
      loadData();
    }
  }, [session]);

  const ofertasFiltradas = ofertas.filter(oferta => {
    if (filtro === 'todas') return true;
    if (filtro === 'activas') return oferta.estado === 'ACTIVA';
    if (filtro === 'ganadas') return oferta.estado === 'GANADORA';
    if (filtro === 'perdidas') return oferta.estado === 'PERDIDA';
    return true;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return {
          text: 'En curso',
          icon: Clock,
          className: 'bg-blue-100 text-blue-800'
        };
      case 'GANADORA':
        return {
          text: 'Ganada',
          icon: Trophy,
          className: 'bg-green-100 text-green-800'
        };
      case 'PERDIDA':
        return {
          text: 'Superada',
          icon: XCircle,
          className: 'bg-orange-100 text-orange-800'
        };
      case 'RECHAZADA':
        return {
          text: 'Rechazada',
          icon: AlertCircle,
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          text: estado,
          icon: Clock,
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la galería
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">Mi Perfil</h1>
            </div>
            <p className="text-gray-600">
              Gestiona tu información y revisa tu actividad
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Información del usuario */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-semibold text-gray-900">{session?.user?.name || 'Sin nombre'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{session?.user?.email || 'Sin email'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {estadisticas && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Gavel className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{estadisticas.total_ofertas}</span>
                    </div>
                    <p className="text-blue-100">Ofertas realizadas</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{estadisticas.ofertas_activas}</span>
                    </div>
                    <p className="text-purple-100">Ofertas activas</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Trophy className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{estadisticas.ofertas_ganadas}</span>
                    </div>
                    <p className="text-green-100">Subastas ganadas</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{estadisticas.tasa_exito.toFixed(0)}%</span>
                    </div>
                    <p className="text-orange-100">Tasa de éxito</p>
                  </div>
                </div>
              )}

              {/* Historial de ofertas */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Historial de Ofertas</h2>
                  
                  {/* Filtros */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFiltro('todas')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtro === 'todas'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFiltro('activas')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtro === 'activas'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Activas
                    </button>
                    <button
                      onClick={() => setFiltro('ganadas')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtro === 'ganadas'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Ganadas
                    </button>
                    <button
                      onClick={() => setFiltro('perdidas')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filtro === 'perdidas'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Superadas
                    </button>
                  </div>
                </div>

                {ofertasFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {filtro === 'todas' 
                        ? 'No has realizado ofertas aún'
                        : `No tienes ofertas ${filtro}`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ofertasFiltradas.map((oferta) => {
                      const badge = getEstadoBadge(oferta.estado);
                      const BadgeIcon = badge.icon;

                      return (
                        <Link
                          key={oferta.id}
                          href={`/obra/${oferta.obra_id}`}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {/* Imagen de la obra */}
                          <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                            {oferta.obra_imagen ? (
                              <img
                                src={`http://localhost:4000${oferta.obra_imagen}`}
                                alt={oferta.obra_nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gavel className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{oferta.obra_nombre}</h3>
                            <p className="text-sm text-gray-600 mb-2">por {oferta.obra_artista}</p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Tu oferta: </span>
                                <span className="font-semibold text-purple-600">
                                  S/ {parseFloat(oferta.monto.toString()).toFixed(2)}
                                </span>
                              </div>
                              
                              {oferta.estado === 'ACTIVA' && (
                                <div>
                                  <span className="text-gray-600">Precio actual: </span>
                                  <span className="font-semibold text-gray-900">
                                    S/ {parseFloat(oferta.obra_precio_actual.toString()).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Estado y fecha */}
                          <div className="flex-shrink-0 text-right">
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-2 ${badge.className}`}>
                              <BadgeIcon className="w-4 h-4" />
                              {badge.text}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(oferta.fecha_oferta).toLocaleDateString('es-PE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default PerfilPage;
