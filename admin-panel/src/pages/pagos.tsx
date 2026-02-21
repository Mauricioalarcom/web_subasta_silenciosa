import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Search,
  Filter,
  FileText,
  Download
} from 'lucide-react';

interface Pago {
  id: string;
  obra_nombre: string;
  obra_artista: string;
  obra_imagen: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_telefono: string;
  monto: number;
  metodo: string;
  estado_pago: string;
  estado_entrega: string;
  fecha_pago: string;
  fecha_confirmacion: string;
  comprobante_url: string;
  created_at: string;
}

interface Estadisticas {
  resumen: {
    pendientes: number;
    procesando: number;
    confirmados: number;
    rechazados: number;
    total_confirmado: number;
    total_pendiente: number;
  };
  entregas: {
    pendientes: number;
    preparacion: number;
    listas: number;
    completadas: number;
  };
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [filtroEstadoEntrega, setFiltroEstadoEntrega] = useState('');
  const [buscar, setBuscar] = useState('');
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const loadEstadisticas = async () => {
    try {
      const response = await authAPI.get('/api/admin/pagos/estadisticas');
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadPagos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      });

      if (filtroEstadoPago) params.append('estado_pago', filtroEstadoPago);
      if (filtroEstadoEntrega) params.append('estado_entrega', filtroEstadoEntrega);

      const response = await authAPI.get(`/api/admin/pagos?${params.toString()}`);
      
      if (response.data.success) {
        let pagosFiltrados = response.data.data;
        
        if (buscar) {
          pagosFiltrados = pagosFiltrados.filter((pago: Pago) =>
            pago.usuario_nombre.toLowerCase().includes(buscar.toLowerCase()) ||
            pago.usuario_email.toLowerCase().includes(buscar.toLowerCase()) ||
            pago.obra_nombre.toLowerCase().includes(buscar.toLowerCase())
          );
        }
        
        setPagos(pagosFiltrados);
      }
    } catch (error: any) {
      console.error('Error al cargar pagos:', error);
      toast.error(error.response?.data?.message || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstadisticas();
    loadPagos();
  }, [filtroEstadoPago, filtroEstadoEntrega]);

  const handleConfirmarPago = async (id: string) => {
    if (!confirm('¿Confirmar este pago?')) return;

    try {
      const response = await authAPI.put(`/api/admin/pagos/${id}/confirmar`, {});
      
      if (response.data.success) {
        toast.success('Pago confirmado exitosamente');
        loadPagos();
        loadEstadisticas();
        setMostrarModal(false);
      }
    } catch (error: any) {
      console.error('Error al confirmar pago:', error);
      toast.error(error.response?.data?.message || 'Error al confirmar pago');
    }
  };

  const handleRechazarPago = async (id: string) => {
    const razon = prompt('¿Por qué rechazas este pago?');
    if (!razon) return;

    try {
      const response = await authAPI.put(`/api/admin/pagos/${id}/rechazar`, {
        razon_rechazo: razon
      });
      
      if (response.data.success) {
        toast.success('Pago rechazado');
        loadPagos();
        loadEstadisticas();
        setMostrarModal(false);
      }
    } catch (error: any) {
      console.error('Error al rechazar pago:', error);
      toast.error(error.response?.data?.message || 'Error al rechazar pago');
    }
  };

  const handleActualizarEntrega = async (id: string, nuevoEstado: string) => {
    try {
      const response = await authAPI.put(`/api/admin/pagos/${id}/entrega`, {
        estado_entrega: nuevoEstado
      });
      
      if (response.data.success) {
        toast.success('Estado de entrega actualizado');
        loadPagos();
        loadEstadisticas();
        setMostrarModal(false);
      }
    } catch (error: any) {
      console.error('Error al actualizar entrega:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar entrega');
    }
  };

  const getEstadoPagoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      PROCESANDO: 'bg-blue-100 text-blue-800',
      CONFIRMADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colores[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado}
      </span>
    );
  };

  const getEstadoEntregaBadge = (estado: string) => {
    const colores: Record<string, string> = {
      PENDIENTE: 'bg-gray-100 text-gray-800',
      EN_PREPARACION: 'bg-blue-100 text-blue-800',
      LISTA_PARA_RECOGER: 'bg-yellow-100 text-yellow-800',
      ENTREGADA: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colores[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Pagos
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los pagos y entregas de las obras vendidas
            </p>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-900">{estadisticas.resumen.pendientes}</p>
                    <p className="text-sm text-yellow-600">
                      S/ {estadisticas.resumen.total_pendiente.toFixed(2)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>

              <div className="card bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Procesando</p>
                    <p className="text-2xl font-bold text-blue-900">{estadisticas.resumen.procesando}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="card bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Confirmados</p>
                    <p className="text-2xl font-bold text-green-900">{estadisticas.resumen.confirmados}</p>
                    <p className="text-sm text-green-600">
                      S/ {estadisticas.resumen.total_confirmado.toFixed(2)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="card bg-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Entregas Pendientes</p>
                    <p className="text-2xl font-bold text-purple-900">{estadisticas.entregas.pendientes + estadisticas.entregas.preparacion}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por usuario u obra..."
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>

              <div>
                <select
                  value={filtroEstadoPago}
                  onChange={(e) => setFiltroEstadoPago(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Todos los estados de pago</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="PROCESANDO">Procesando</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>

              <div>
                <select
                  value={filtroEstadoEntrega}
                  onChange={(e) => setFiltroEstadoEntrega(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Todos los estados de entrega</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PREPARACION">En preparación</option>
                  <option value="LISTA_PARA_RECOGER">Lista para recoger</option>
                  <option value="ENTREGADA">Entregada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Pagos */}
          {loading ? (
            <div className="card">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            </div>
          ) : pagos.length === 0 ? (
            <div className="card text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay pagos
              </h3>
              <p className="text-gray-600">
                Los pagos aparecerán aquí cuando se vendan obras
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Obra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado Entrega
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {pago.usuario_nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pago.usuario_email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {pago.obra_imagen && (
                              <img
                                src={pago.obra_imagen}
                                alt={pago.obra_nombre}
                                className="h-10 w-10 rounded object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {pago.obra_nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                {pago.obra_artista}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          S/ {parseFloat(pago.monto).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {pago.metodo || 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getEstadoPagoBadge(pago.estado_pago)}
                        </td>
                        <td className="px-6 py-4">
                          {getEstadoEntregaBadge(pago.estado_entrega)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setPagoSeleccionado(pago);
                              setMostrarModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                          >
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal de Detalles */}
          {mostrarModal && pagoSeleccionado && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Detalles del Pago
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Información del Usuario</h3>
                      <p className="text-sm text-gray-600">{pagoSeleccionado.usuario_nombre}</p>
                      <p className="text-sm text-gray-600">{pagoSeleccionado.usuario_email}</p>
                      {pagoSeleccionado.usuario_telefono && (
                        <p className="text-sm text-gray-600">{pagoSeleccionado.usuario_telefono}</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Obra</h3>
                      <p className="text-sm text-gray-600">{pagoSeleccionado.obra_nombre}</p>
                      <p className="text-sm text-gray-600">{pagoSeleccionado.obra_artista}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Pago</h3>
                      <p className="text-sm text-gray-600">
                        Monto: <span className="font-semibold">S/ {parseFloat(pagoSeleccionado.monto).toFixed(2)}</span>
                      </p>
                      <p className="text-sm text-gray-600">Método: {pagoSeleccionado.metodo || 'No seleccionado'}</p>
                      <p className="text-sm text-gray-600">Estado: {getEstadoPagoBadge(pagoSeleccionado.estado_pago)}</p>
                    </div>

                    {pagoSeleccionado.comprobante_url && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Comprobante</h3>
                        <a
                          href={pagoSeleccionado.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-900 text-sm flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar comprobante
                        </a>
                      </div>
                    )}

                    {/* Acciones */}
                    {pagoSeleccionado.estado_pago === 'PROCESANDO' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={() => handleConfirmarPago(pagoSeleccionado.id)}
                          className="btn btn-primary flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Pago
                        </button>
                        <button
                          onClick={() => handleRechazarPago(pagoSeleccionado.id)}
                          className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rechazar
                        </button>
                      </div>
                    )}

                    {pagoSeleccionado.estado_pago === 'CONFIRMADO' && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-gray-900 mb-2">Estado de Entrega</h3>
                        <select
                          value={pagoSeleccionado.estado_entrega}
                          onChange={(e) => handleActualizarEntrega(pagoSeleccionado.id, e.target.value)}
                          className="input w-full"
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="EN_PREPARACION">En preparación</option>
                          <option value="LISTA_PARA_RECOGER">Lista para recoger</option>
                          <option value="ENTREGADA">Entregada</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setMostrarModal(false)}
                      className="btn btn-secondary"
                    >
                      Cerrar
                    </button>
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
