'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect, useRef } from 'react';
import { authAPI, publicAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Countdown } from '@/components/Countdown';
import FavoritoToggle from '@/components/FavoritoToggle';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  Gavel,
  Clock,
  DollarSign,
  User,
  Zap,
  AlertCircle,
  Trophy,
  Heart,
  Share2,
  TrendingUp
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
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params?.id as string;
  
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
        if (data.ganador.usuario_id === session?.user?.id) {
          toast.success(
            `🎉 ¡Felicidades, ganaste la subasta!\nPrecio final: S/ ${data.ganador.monto_final.toFixed(2)}`,
            { duration: 10000 }
          );
        } else {
          toast(
            `🏁 Subasta cerrada\nGanador: ${data.ganador.usuario_nombre}`,
            { duration: 5000 }
          );
        }
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
  }, [obra?.id, session?.user?.id]);

  const loadObra = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.get(`/api/admin/obras/${id}`);
      
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
      const response = await publicAPI.get(`/api/ofertas/obra/${id}`);
      
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
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!obra) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Obra no encontrada</h2>
          <Link href="/" className="text-purple-600 hover:underline">
            Volver a la galería
          </Link>
        </div>
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la galería
            </Link>
            
            {/* Indicador de conexión WebSocket */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-600 animate-pulse' : 'bg-red-600'
                }`}></div>
                {isConnected ? 'Subasta en vivo' : 'Desconectado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Imágenes e info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Galería de imágenes */}
              <div className="bg-white rounded-xl shadow-sm p-6">
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
                                ? 'border-purple-600 ring-2 ring-purple-200'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <img
                              src={`http://localhost:4000${img}`}
                              alt={`${obra.nombre} - ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Sin imagen</p>
                  </div>
                )}
              </div>

              {/* Información de la obra */}
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{obra.nombre}</h1>
                      <p className="text-xl text-gray-600">por {obra.artista}</p>
                    </div>
                    <FavoritoToggle obraId={obra.id} />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed">{obra.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm text-gray-500">Técnica</p>
                    <p className="font-medium text-gray-900">{obra.tecnica}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dimensiones</p>
                    <p className="font-medium text-gray-900">{obra.dimensiones}</p>
                  </div>
                  {obra.anio && (
                    <div>
                      <p className="text-sm text-gray-500">Año</p>
                      <p className="font-medium text-gray-900">{obra.anio}</p>
                    </div>
                  )}
                </div>

                {obra.info_adicional && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Información adicional</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{obra.info_adicional}</p>
                  </div>
                )}
              </div>

              {/* Historial de ofertas */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Historial de Ofertas ({obra.numero_ofertas})
                  </h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingOfertas ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                  ) : ofertas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Gavel className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Aún no hay ofertas</p>
                      <p className="text-sm mt-1">¡Sé el primero en ofertar!</p>
                    </div>
                  ) : (
                    ofertas.map((oferta, idx) => (
                      <div
                        key={oferta.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          idx === 0
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {idx === 0 && (
                            <Trophy className="w-5 h-5 text-purple-600" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {oferta.usuario_nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(oferta.fecha_oferta).toLocaleString('es-PE')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${idx === 0 ? 'text-purple-600 text-lg' : 'text-gray-900'}`}>
                            S/ {parseFloat(oferta.monto).toFixed(2)}
                          </p>
                          {idx === 0 && (
                            <span className="text-xs font-medium text-purple-600">Oferta ganadora</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={ofertasEndRef} />
                </div>
              </div>
            </div>

            {/* Columna derecha: Panel de ofertas */}
            <div className="space-y-6">
              {/* Countdown */}
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Tiempo restante</h3>
                <Countdown 
                  fechaCierre={obra.fecha_cierre}
                  className="text-white"
                  showIcon={true}
                />
              </div>

              {/* Información de precios */}
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Precio actual</p>
                  <p className="text-3xl font-bold text-purple-600">
                    S/ {parseFloat(obra.precio_actual.toString()).toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Precio base</p>
                    <p className="font-semibold text-gray-900">
                      S/ {parseFloat(obra.precio_base.toString()).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Incremento mínimo</p>
                    <p className="font-semibold text-gray-900">
                      S/ 10.00
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 border-t border-gray-200 pt-4">
                  <User className="w-4 h-4" />
                  <span>{obra.numero_ofertas} oferta{obra.numero_ofertas !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Formulario de oferta */}
              {obra.estado === 'ACTIVA' ? (
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Hacer una oferta</h3>
                  
                  <form onSubmit={handleSubmitOferta} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tu oferta
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min={montoMinimo}
                          value={montoOferta}
                          onChange={(e) => setMontoOferta(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                          placeholder={`Mínimo S/ ${montoMinimo.toFixed(2)}`}
                          disabled={submittingOferta}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Mínimo: S/ {montoMinimo.toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOferta}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      {submittingOferta ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Gavel className="w-5 h-5" />
                          Hacer Oferta
                        </>
                      )}
                    </button>
                  </form>

                  {/* Botón compra inmediata */}
                  {obra.precio_comprar_ahora && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleCompraInmediata}
                        disabled={submittingOferta}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        <Zap className="w-5 h-5" />
                        Comprar Ahora - S/ {parseFloat(obra.precio_comprar_ahora.toString()).toFixed(2)}
                      </button>
                      <p className="mt-2 text-xs text-center text-gray-500">
                        Finaliza la subasta inmediatamente
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Subasta Cerrada</h3>
                  <p className="text-sm text-gray-600">Esta subasta ha finalizado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
