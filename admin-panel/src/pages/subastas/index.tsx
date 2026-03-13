import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { 
  Gavel,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { CountdownCompact } from '@/components/Countdown';

interface Obra {
  id: string;
  nombre: string;
  artista: string;
  descripcion: string;
  imagen_principal: string;
  precio_base: number;
  precio_actual: number;
  incremento_minimo: number;
  precio_comprar_ahora: number | null;
  numero_ofertas: number;
  fecha_cierre: string;
  estado: string;
}

export default function ObrasActivasPage() {
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('ACTIVA');

  useEffect(() => {
    loadObras();
  }, [filtroEstado]);

  const loadObras = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get('/api/admin/obras', {
        params: {
          estado: filtroEstado,
          limit: 100
        }
      });

      if (response.data.success) {
        setObras(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar obras:', error);
      toast.error('Error al cargar obras');
    } finally {
      setLoading(false);
    }
  };

  const obrasFiltradas = obras.filter(obra =>
    obra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.artista.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      ACTIVA: { color: 'bg-green-100 text-green-800', text: 'Activa' },
      VENDIDA: { color: 'bg-blue-100 text-blue-800', text: 'Vendida' },
      NO_VENDIDA: { color: 'bg-gray-100 text-gray-800', text: 'No vendida' },
      PAUSADA: { color: 'bg-yellow-100 text-yellow-800', text: 'Pausada' }
    };
    const badge = badges[estado] || badges.ACTIVA;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Gavel className="w-8 h-8 text-purple-600" />
                  Subastas Activas
                </h1>
                <p className="text-gray-600 mt-2">
                  Participa en las subastas en tiempo real
                </p>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o artista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Filtro de estado */}
              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ACTIVA">Activas</option>
                  <option value="VENDIDA">Vendidas</option>
                  <option value="NO_VENDIDA">No vendidas</option>
                  <option value="">Todas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de obras */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : obrasFiltradas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay obras disponibles
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'No se encontraron obras con ese criterio de búsqueda'
                  : 'No hay obras activas en este momento'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {obrasFiltradas.map((obra) => (
                <Link
                  key={obra.id}
                  href={`/subastas/${obra.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer border border-gray-200 hover:border-purple-300"
                >
                  {/* Imagen */}
                  <div className="relative h-64 bg-gray-100 overflow-hidden">
                    {obra.imagen_principal ? (
                      <img
                        src={`http://localhost:4000${obra.imagen_principal}`}
                        alt={obra.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {/* Badge de estado */}
                    <div className="absolute top-3 right-3">
                      {getEstadoBadge(obra.estado)}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    {/* Título y artista */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                      {obra.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{obra.artista}</p>

                    {/* Precios */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Precio actual:</span>
                        <span className="text-lg font-bold text-purple-600">
                          S/ {Number(obra.precio_actual).toFixed(2)}
                        </span>
                      </div>
                      {obra.numero_ofertas > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{obra.numero_ofertas} oferta(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Countdown */}
                    {obra.estado === 'ACTIVA' && (
                      <div className="pt-3 border-t border-gray-200">
                        <CountdownCompact fechaCierre={obra.fecha_cierre} />
                      </div>
                    )}

                    {/* Compra inmediata */}
                    {obra.precio_comprar_ahora && obra.estado === 'ACTIVA' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Compra inmediata:</span>
                          <span className="font-semibold text-green-600">
                            S/ {parseFloat(obra.precio_comprar_ahora.toString()).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Estadísticas rápidas */}
          {!loading && obras.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Gavel className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total obras</p>
                    <p className="text-2xl font-bold text-gray-900">{obrasFiltradas.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total ofertas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {obrasFiltradas.reduce((sum, obra) => sum + obra.numero_ofertas, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valor total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      S/ {obrasFiltradas.reduce((sum, obra) => sum + parseFloat(obra.precio_actual.toString()), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
