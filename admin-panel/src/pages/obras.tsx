import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Download,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface Obra {
  id: string;
  nombre: string;
  artista: string;
  descripcion: string;
  tecnica: string;
  dimensiones: string;
  anio: number;
  imagen_principal: string;
  precio_base: number;
  precio_actual: number;
  precio_comprar_ahora: number | null;
  incremento_minimo: number;
  fecha_cierre: string;
  estado: string;
  numero_ofertas: number;
  mejor_postor_nombre: string | null;
  evento_nombre: string;
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const estados = [
    { value: '', label: 'Todos' },
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'PUBLICADA', label: 'Publicada' },
    { value: 'ACTIVA', label: 'Activa' },
    { value: 'EXTENDIDA', label: 'Extendida' },
    { value: 'CERRADA', label: 'Cerrada' },
    { value: 'VENDIDA', label: 'Vendida' },
    { value: 'NO_VENDIDA', label: 'No Vendida' }
  ];

  const loadObras = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        order_by: 'created_at',
        order_dir: 'DESC'
      });

      if (buscar) params.append('buscar', buscar);
      if (filtroEstado) params.append('estado', filtroEstado);

      const response = await authAPI.get(`/api/admin/obras?${params.toString()}`);
      
      if (response.data.success) {
        setObras(response.data.data);
        setTotal(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error: any) {
      console.error('Error al cargar obras:', error);
      toast.error(error.response?.data?.message || 'Error al cargar obras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObras();
  }, [page, filtroEstado]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadObras();
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la obra "${nombre}"?`)) {
      return;
    }

    try {
      const response = await authAPI.delete(`/api/admin/obras/${id}`);
      
      if (response.data.success) {
        toast.success('Obra eliminada exitosamente');
        loadObras();
      }
    } catch (error: any) {
      console.error('Error al eliminar obra:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar obra');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      BORRADOR: 'bg-gray-100 text-gray-800',
      PUBLICADA: 'bg-blue-100 text-blue-800',
      ACTIVA: 'bg-green-100 text-green-800',
      EXTENDIDA: 'bg-yellow-100 text-yellow-800',
      CERRADA: 'bg-red-100 text-red-800',
      VENDIDA: 'bg-purple-100 text-purple-800',
      NO_VENDIDA: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colores[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Obras
              </h1>
              <p className="text-gray-600 mt-1">
                {total} obra{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/obras/nueva"
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Obra
            </Link>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="card mb-6">
            <form onSubmit={handleBuscar} className="space-y-4">
              {/* Barra de búsqueda */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, artista o descripción..."
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
              </div>

              {/* Filtros adicionales */}
              {mostrarFiltros && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => {
                        setFiltroEstado(e.target.value);
                        setPage(1);
                      }}
                      className="input w-full"
                    >
                      {estados.map(estado => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Tabla de Obras */}
          {loading ? (
            <div className="card">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            </div>
          ) : obras.length === 0 ? (
            <div className="card text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay obras registradas
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza agregando tu primera obra de arte
              </p>
              <Link href="/obras/nueva" className="btn btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear Nueva Obra
              </Link>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Obra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precios
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ofertas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Cierre
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {obras.map((obra) => (
                        <tr key={obra.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-16 w-16 flex-shrink-0 mr-4">
                                {obra.imagen_principal ? (
                                  <img
                                    src={obra.imagen_principal}
                                    alt={obra.nombre}
                                    className="h-16 w-16 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {obra.nombre}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {obra.artista}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {obra.tecnica} {obra.anio && `(${obra.anio})`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-gray-900 font-medium">
                                <DollarSign className="w-3 h-3" />
                                S/ {parseFloat(obra.precio_base).toFixed(2)}
                              </div>
                              {obra.precio_actual > obra.precio_base && (
                                <div className="flex items-center gap-1 text-green-600 font-semibold">
                                  <Award className="w-3 h-3" />
                                  S/ {parseFloat(obra.precio_actual).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="text-gray-900 font-medium">
                                {obra.numero_ofertas} oferta{obra.numero_ofertas !== 1 ? 's' : ''}
                              </div>
                              {obra.mejor_postor_nombre && (
                                <div className="text-xs text-gray-500">
                                  {obra.mejor_postor_nombre}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getEstadoBadge(obra.estado)}
                            {obra.estado === 'VENDIDA' && (
                              <div className="mt-1 text-xs text-purple-600 font-medium">
                                SOLD
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(obra.fecha_cierre).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(obra.fecha_cierre).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/obras/${obra.id}`}
                                className="text-purple-600 hover:text-purple-900"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/obras/${obra.id}/editar`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleEliminar(obra.id, obra.nombre)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                                disabled={obra.numero_ofertas > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
