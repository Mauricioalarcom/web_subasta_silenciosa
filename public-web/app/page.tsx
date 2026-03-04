'use client';

import { useState, useEffect } from 'react';
import { publicAPI } from '@/lib/api';
import { Obra } from '@/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import EventoSidebar from '@/components/EventoSidebar';
import FavoritoToggle from '@/components/FavoritoToggle';
import { 
  Search, 
  Filter, 
  Clock, 
  Gavel, 
  Heart,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <GaleriaContent />
    </ProtectedRoute>
  );
}

function GaleriaContent() {
  const { data: session } = useSession();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'reciente' | 'precio' | 'ofertas'>('reciente');

  useEffect(() => {
    loadObras();
  }, []);

  const loadObras = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.get('/api/admin/obras', {
        params: {
          estado: 'ACTIVA',
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

  // Filtrar y ordenar obras con prioridad al nombre del artista
  const obrasFiltradas = obras
    .filter(obra => {
      const searchLower = searchTerm.toLowerCase();
      const nombreMatch = obra.nombre.toLowerCase().includes(searchLower);
      const artistaMatch = obra.artista.toLowerCase().includes(searchLower);
      return nombreMatch || artistaMatch;
    })
    .sort((a, b) => {
      // Si hay búsqueda, priorizar resultados por artista
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const aArtistaMatch = a.artista.toLowerCase().includes(searchLower);
        const bArtistaMatch = b.artista.toLowerCase().includes(searchLower);
        
        if (aArtistaMatch && !bArtistaMatch) return -1;
        if (!aArtistaMatch && bArtistaMatch) return 1;
      }
      
      // Aplicar ordenamiento seleccionado
      switch (sortBy) {
        case 'precio':
          return parseFloat(b.precio_actual.toString()) - parseFloat(a.precio_actual.toString());
        case 'ofertas':
          return b.numero_ofertas - a.numero_ofertas;
        case 'reciente':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Calcular tiempo restante o próximo inicio
  const getTiempoRestante = (fechaCierre: string) => {
    const now = new Date().getTime();
    const cierre = new Date(fechaCierre).getTime();
    const diff = cierre - now;

    if (diff <= 0) return 'Finalizada';

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  };

  // Verificar si la obra está por iniciar (para countdown previo)
  const esProximaAIniciar = (fechaCierre: string): boolean => {
    // Si hay fecha de inicio en la obra, usarla. Por ahora asumimos que ya iniciaron.
    // Esta funcionalidad se puede expandir cuando se agreguen fechas de inicio a las obras
    return false;
  };

  const getTiempoHastaInicio = (fechaInicio: string) => {
    const now = new Date().getTime();
    const inicio = new Date(fechaInicio).getTime();
    const diff = inicio - now;

    if (diff <= 0) return null;

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) return `Inicia en ${dias}d ${horas}h`;
    if (horas > 0) return `Inicia en ${horas}h ${minutos}m`;
    return `Inicia en ${minutos}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Galería de Subastas
            </h1>
            <p className="text-gray-600">
              Explora y participa en nuestras subastas silenciosas de arte contemporáneo
            </p>
          </div>

          {/* Filtros */}
          <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por obra o artista..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Ordenar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-gray-900"
                >
                  <option value="reciente">Más recientes</option>
                  <option value="precio">Mayor precio</option>
                  <option value="ofertas">Más ofertas</option>
                </select>
              </div>
            </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span>{obrasFiltradas.length} obras disponibles</span>
          {!session && (
            <span className="text-purple-600">
              <Link href="/login" className="hover:underline">
                Inicia sesión para ofertar
              </Link>
            </span>
          )}
        </div>
      </div>

      {/* Grid de obras */}
      {obrasFiltradas.length === 0 ? (
        <div className="text-center py-20">
          <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No se encontraron obras
          </h2>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Intenta con otro término de búsqueda'
              : 'No hay subastas activas en este momento'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {obrasFiltradas.map((obra) => (
            <Link
              key={obra.id}
              href={`/obra/${obra.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow overflow-hidden group"
            >
              {/* Imagen */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {obra.imagen_principal ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${obra.imagen_principal}`}
                    alt={obra.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Toggle de favoritos - esquina superior izquierda */}
                <div className="absolute top-3 left-3 z-10">
                  <FavoritoToggle obraId={obra.id} />
                </div>

                {/* Badge de tiempo restante */}
                <div className={`absolute top-3 right-3 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                  getTiempoRestante(obra.fecha_cierre) === 'Finalizada'
                    ? 'bg-gray-600/90'
                    : 'bg-black/70'
                }`}>
                  <Clock className="w-4 h-4" />
                  {getTiempoRestante(obra.fecha_cierre)}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                  {obra.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-4">por {obra.artista}</p>

                {/* Precio actual */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Precio actual</p>
                  <p className="text-2xl font-bold text-purple-600">
                    S/ {parseFloat(obra.precio_actual.toString()).toFixed(2)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {obra.numero_ofertas} {obra.numero_ofertas === 1 ? 'oferta' : 'ofertas'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Gavel className="w-4 h-4" />
                    +S/ 10.00
                  </div>
                </div>

                {/* Compra inmediata */}
                {obra.precio_comprar_ahora && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      Compra inmediata:{' '}
                      <span className="font-semibold text-green-600">
                        S/ {parseFloat(obra.precio_comprar_ahora.toString()).toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
        </div>

        {/* Sidebar del evento */}
        <div className="lg:col-span-1">
          <EventoSidebar />
        </div>
      </div>
    </div>
  );
}
