'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import FavoritoToggle from '@/components/FavoritoToggle';
import { Countdown } from '@/components/Countdown';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  Heart, 
  Gavel, 
  Clock, 
  TrendingUp,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';

interface ObraFavorita {
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
  favorito_id: string;
  fecha_agregado: string;
}

function FavoritosPage() {
  const { data: session } = useSession();
  const [favoritos, setFavoritos] = useState<ObraFavorita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavoritos = async () => {
      try {
        setLoading(true);
        const token = session?.user?.accessToken;
        if (!token) return;

      const response = await fetch('http://localhost:4000/api/favoritos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

        if (response.ok) {
          const data = await response.json();
          setFavoritos(data.data);
        } else {
          toast.error('Error al cargar favoritos');
        }
      } catch (error) {
        console.error('Error al cargar favoritos:', error);
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.accessToken) {
      loadFavoritos();
    }
  }, [session]);

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
              <Heart className="w-8 h-8 text-red-600 fill-current" />
              <h1 className="text-4xl font-bold text-gray-900">Mis Favoritos</h1>
            </div>
            <p className="text-gray-600">
              Obras que has guardado para seguir de cerca
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : favoritos.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No tienes favoritos aún
              </h2>
              <p className="text-gray-600 mb-6">
                Explora la galería y guarda las obras que más te interesen
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Gavel className="w-5 h-5" />
                Explorar obras
              </Link>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">
                  {favoritos.length} {favoritos.length === 1 ? 'obra favorita' : 'obras favoritas'}
                </p>
              </div>

              {/* Grid de obras favoritas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritos.map((obra) => (
                  <Link
                    key={obra.id}
                    href={`/obra/${obra.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow overflow-hidden group"
                  >
                    {/* Imagen */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {obra.imagen_principal ? (
                        <img
                          src={`http://localhost:4000${obra.imagen_principal}`}
                          alt={obra.nombre}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-300" />
                        </div>
                      )}

                      {/* Toggle de favoritos */}
                      <div className="absolute top-3 left-3 z-10">
                        <FavoritoToggle obraId={obra.id} />
                      </div>

                      {/* Badge de tiempo restante */}
                      <div className="absolute top-3 right-3">
                        <Countdown 
                          fechaCierre={obra.fecha_cierre}
                          className="text-sm"
                        />
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
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default FavoritosPage;
