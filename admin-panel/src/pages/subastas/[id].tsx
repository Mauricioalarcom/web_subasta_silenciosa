import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { useState, useEffect, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Countdown } from '@/components/Countdown';
import { 
  ArrowLeft,
  Gavel,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
  AlertCircle,
  Trophy,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

interface Obra {
  id: string;
  nombre: string;
  artista: string;
  descripcion: string;
  tecnica: string;
  dimensiones: string;
  anio: number | null;
  info_adicional: string;
  imagen_principal: string;
  imagenes: string[];
  precio_base: number;
  precio_actual: number;
  incremento_minimo: number;
  precio_comprar_ahora: number | null;
  numero_ofertas: number;
  fecha_cierre: string;
  estado: string;
}

interface Oferta {
  id: string;
  monto: string;
  estado: string;
  usuario_nombre: string;
  usuario_email: string;
  fecha_oferta: string;
}

export default function ObraDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOfertas, setLoadingOfertas] = useState(false);
  const [submittingOferta, setSubmittingOferta] = useState(false);
  
  const [montoOferta, setMontoOferta] = useState('');
  const [imagenActual, setImagenActual] = useState(0);
  
  const ofertasEndRef = useRef<HTMLDivElement>(null);
  
  // WebSocket
  const {
    isConnected,
    joinObra,
    leaveObra,
    onObraEstado,
    onNuevaOferta,
    onSuperado,
    onSubastaCerrada,
    onGanaste,
    onExtensionTiempo,
    onAdvertenciaCierre
  } = useWebSocket();

  // Cargar obra
  useEffect(() => {
    if (id) {
      loadObra();
      loadOfertas();
    }
  }, [id]);

  // Conectar a WebSocket cuando se carga la obra
  useEffect(() => {
    if (obra && isConnected) {
      joinObra(obra.id);
      
      // Cleanup al desmontar
      return () => {
        leaveObra(obra.id);
      };
    }
  }, [obra?.id, isConnected]);

  // Listeners de WebSocket
  useEffect(() => {
    if (!obra) return;

    // Estado inicial de obra
    const cleanupEstado = onObraEstado((data) => {
      console.log('📊 Estado de obra recibido:', data);
      setObra(prev => prev ? {
        ...prev,
        precio_actual: data.precio_actual,
        numero_ofertas: data.numero_ofertas,
        fecha_cierre: data.obra.fecha_cierre
      } : null);
    });

    // Nueva oferta
    const cleanupNuevaOferta = onNuevaOferta((data) => {
      console.log('🔔 Nueva oferta recibida:', data);
      
      setObra(prev => prev ? {
        ...prev,
        precio_actual: data.precio_actual,
        numero_ofertas: data.numero_ofertas,
        fecha_cierre: data.fecha_cierre
      } : null);

      // Recargar ofertas
      loadOfertas();

      // Mostrar notificación
      toast.success(`Nueva oferta: S/ ${data.precio_actual.toFixed(2)}`, {
        icon: '💰',
        duration: 3000
      });

      // Si hubo extensión de tiempo
      if (data.tiempo_extendido) {
        toast(`⏰ ¡Tiempo extendido! +2 minutos`, {
          icon: '⏱️',
          duration: 5000
        });
      }

      // Si fue compra inmediata
      if (data.compra_inmediata) {
        toast.success('🎉 ¡Compra inmediata realizada!', {
          duration: 5000
        });
      }
    });

    // Fuiste superado
    const cleanupSuperado = onSuperado((data) => {
      console.log('⚠️ Fuiste superado:', data);
      toast.error(`¡Tu oferta fue superada! Nuevo precio: S/ ${data.nuevo_precio.toFixed(2)}`, {
        icon: '⚠️',
        duration: 5000
      });
    });

    // Subasta cerrada
    const cleanupCerrada = onSubastaCerrada((data) => {
      console.log('🏁 Subasta cerrada:', data);
      
      setObra(prev => prev ? { ...prev, estado: 'VENDIDA' } : null);
      
      if (data.ganador) {
        toast.success(
          `🏆 Subasta cerrada\nGanador: ${data.ganador.usuario_nombre}\nPrecio final: S/ ${data.ganador.monto_final.toFixed(2)}`,
          { duration: 10000 }
        );
      } else {
        toast('Subasta cerrada sin ofertas', {
          icon: '🏁',
          duration: 5000
        });
      }
    });

    // Ganaste!
    const cleanupGanaste = onGanaste((data) => {
      console.log('🎉 ¡Ganaste!:', data);
      toast.success('🎉 ¡Felicidades, ganaste la subasta!', {
        duration: 10000
      });
    });

    // Extensión de tiempo
    const cleanupExtension = onExtensionTiempo((data) => {
      console.log('⏰ Extensión de tiempo:', data);
      setObra(prev => prev ? {
        ...prev,
        fecha_cierre: data.nueva_fecha_cierre
      } : null);
      
      toast(`⏰ Tiempo extendido: +${Math.floor(data.segundos_extendidos / 60)} min`, {
        icon: '⏱️',
        duration: 5000
      });
    });

    // Advertencia de cierre
    const cleanupAdvertencia = onAdvertenciaCierre((data) => {
      console.log('⚠️ Advertencia de cierre:', data);
      toast(data.mensaje, {
        icon: '⚠️',
        duration: 5000
      });
    });

    // Cleanup de todos los listeners
    return () => {
      cleanupEstado();
      cleanupNuevaOferta();
      cleanupSuperado();
      cleanupCerrada();
      cleanupGanaste();
      cleanupExtension();
      cleanupAdvertencia();
    };
  }, [obra?.id]);

  const loadObra = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/api/admin/obras/${id}`);
      
      if (response.data.success) {
        setObra(response.data.data);
        
        // Inicializar monto con el mínimo requerido (+10)
        const precioActual = parseFloat(response.data.data.precio_actual);
        const INCREMENTO_MINIMO = 10;
        setMontoOferta((precioActual + INCREMENTO_MINIMO).toFixed(2));
      }
    } catch (error: any) {
      console.error('Error al cargar obra:', error);
      toast.error('Error al cargar obra');
    } finally {
      setLoading(false);
    }
  };

  const loadOfertas = async () => {
    try {
      setLoadingOfertas(true);
      const response = await authAPI.get(`/api/ofertas/obra/${id}`);
      
      if (response.data.success) {
        setOfertas(response.data.data);
        
        // Scroll al final
        setTimeout(() => {
          ofertasEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error: any) {
      console.error('Error al cargar ofertas:', error);
    } finally {
      setLoadingOfertas(false);
    }
  };

  const handleSubmitOferta = async (e: React.FormEvent, esCompraInmediata: boolean = false) => {
    e.preventDefault();
    
    if (!obra) return;
    
    const monto = parseFloat(montoOferta);
    
    // Validaciones
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    
    if (!esCompraInmediata) {
      const INCREMENTO_MINIMO = 10;
      const montoMinimo = parseFloat(obra.precio_actual.toString()) + INCREMENTO_MINIMO;
      if (monto < montoMinimo) {
        toast.error(`El monto mínimo es S/ ${montoMinimo.toFixed(2)}`);
        return;
      }
    }
    
    try {
      setSubmittingOferta(true);
      
      const response = await authAPI.post('/api/ofertas', {
        obra_id: obra.id,
        monto,
        es_compra_inmediata: esCompraInmediata
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        
        // Actualizar monto para la siguiente oferta (+10)
        const INCREMENTO_MINIMO = 10;
        const nuevoMinimo = monto + INCREMENTO_MINIMO;
        setMontoOferta(nuevoMinimo.toFixed(2));
        
        // Recargar ofertas
        loadOfertas();
      }
    } catch (error: any) {
      console.error('Error al crear oferta:', error);
      toast.error(error.response?.data?.message || 'Error al crear oferta');
    } finally {
      setSubmittingOferta(false);
    }
  };

  const handleCompraInmediata = (e: React.FormEvent) => {
    if (!obra?.precio_comprar_ahora) return;
    setMontoOferta(obra.precio_comprar_ahora.toString());
    handleSubmitOferta(e, true);
  };

  if (loading) {
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

  if (!obra) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Obra no encontrada</h2>
            <Link href="/subastas" className="text-purple-600 hover:underline mt-4 inline-block">
              Volver a subastas
            </Link>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const INCREMENTO_MINIMO = 10;
  const montoMinimo = parseFloat(obra.precio_actual.toString()) + INCREMENTO_MINIMO;
  const imagenes = obra.imagen_principal 
    ? [obra.imagen_principal, ...obra.imagenes]
    : obra.imagenes;

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href="/subastas"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a subastas
            </Link>
            
            {/* Indicador de conexión WebSocket */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-600 animate-pulse' : 'bg-red-600'
                }`}></div>
                {isConnected ? 'En vivo' : 'Desconectado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Imágenes e info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Galería de imágenes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                {imagenes.length > 0 ? (
                  <div>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={`http://localhost:4000${imagenes[imagenActual]}`}
                        alt={obra.nombre}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {imagenes.length > 1 && (
                      <div className="grid grid-cols-6 gap-2">
                        {imagenes.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setImagenActual(idx)}
                            className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                              imagenActual === idx 
                                ? 'border-purple-600 scale-95' 
                                : 'border-transparent hover:border-purple-300'
                            }`}
                          >
                            <img
                              src={`http://localhost:4000${img}`}
                              alt={`${obra.nombre} ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Información de la obra */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {obra.nombre}
                </h1>
                <p className="text-xl text-gray-600 mb-6">por {obra.artista}</p>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700">{obra.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
                  {obra.tecnica && (
                    <div>
                      <p className="text-sm text-gray-600">Técnica</p>
                      <p className="font-medium">{obra.tecnica}</p>
                    </div>
                  )}
                  {obra.dimensiones && (
                    <div>
                      <p className="text-sm text-gray-600">Dimensiones</p>
                      <p className="font-medium">{obra.dimensiones}</p>
                    </div>
                  )}
                  {obra.anio && (
                    <div>
                      <p className="text-sm text-gray-600">Año</p>
                      <p className="font-medium">{obra.anio}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="font-medium">{obra.estado}</p>
                  </div>
                </div>

                {obra.info_adicional && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-1">Información adicional</p>
                    <p className="text-gray-700">{obra.info_adicional}</p>
                  </div>
                )}
              </div>

              {/* Historial de ofertas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Historial de Ofertas ({ofertas.length})
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingOfertas ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                  ) : ofertas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Info className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Aún no hay ofertas. ¡Sé el primero!</p>
                    </div>
                  ) : (
                    ofertas.map((oferta, idx) => (
                      <div
                        key={oferta.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          idx === 0 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {idx === 0 && (
                            <Trophy className="w-5 h-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {oferta.usuario_nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(oferta.fecha_oferta).toLocaleString('es-PE')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            idx === 0 ? 'text-green-600 text-lg' : 'text-gray-900'
                          }`}>
                            S/ {Number(oferta.monto).toFixed(2)}
                          </p>
                          {idx === 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              Ganando
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={ofertasEndRef} />
                </div>
              </div>
            </div>

            {/* Columna derecha: Ofertar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6 space-y-6">
                {/* Countdown */}
                {obra.estado === 'ACTIVA' && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Tiempo restante:</p>
                    <Countdown 
                      fechaCierre={obra.fecha_cierre}
                      onExpired={() => {
                        setObra(prev => prev ? { ...prev, estado: 'VENDIDA' } : null);
                        toast('La subasta ha finalizado', { icon: '🏁' });
                      }}
                    />
                  </div>
                )}

                {/* Precio actual */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Precio actual</p>
                  <p className="text-4xl font-bold text-purple-600">
                    S/ {Number(obra.precio_actual).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {obra.numero_ofertas} oferta(s)
                  </p>
                </div>

                {obra.estado === 'ACTIVA' ? (
                  <>
                    {/* Formulario de oferta */}
                    <form onSubmit={handleSubmitOferta} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tu oferta
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            S/
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min={montoMinimo}
                            value={montoOferta}
                            onChange={(e) => setMontoOferta(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                            disabled={submittingOferta}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Mínimo: S/ {montoMinimo.toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingOferta}
                        className="btn btn-primary w-full py-3 text-lg"
                      >
                        {submittingOferta ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Procesando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Gavel className="w-5 h-5" />
                            Hacer Oferta
                          </span>
                        )}
                      </button>
                    </form>

                    {/* Compra inmediata */}
                    {obra.precio_comprar_ahora && (
                      <button
                        onClick={handleCompraInmediata}
                        disabled={submittingOferta}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        Comprar Ya por S/ {Number(obra.precio_comprar_ahora).toFixed(2)}
                      </button>
                    )}

                    {/* Info */}
                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Reglas de la subasta:</p>
                          <ul className="text-xs space-y-1">
                            <li>• Incremento mínimo: S/ 10.00</li>
                            <li>• Ofertas en el último minuto extienden +2 min</li>
                            <li>• No puedes ofertar sobre tu propia oferta</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">
                      Esta subasta ha finalizado
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
