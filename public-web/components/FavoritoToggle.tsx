'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface FavoritoToggleProps {
  obraId: string;
  className?: string;
}

export default function FavoritoToggle({ obraId, className = '' }: FavoritoToggleProps) {
  const { data: session, status } = useSession();
  const [isFavorito, setIsFavorito] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si la obra está en favoritos
  useEffect(() => {
    const checkFavorito = async () => {
      try {
        const token = (session as any)?.backendToken;
        if (!token) return;

        const response = await fetch(`http://localhost:4000/api/favoritos/check/${obraId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorito(data.data.es_favorito);
        }
      } catch (error) {
        console.error('Error al verificar favorito:', error);
      }
    };

    if (status === 'authenticated' && (session as any)?.backendToken) {
      checkFavorito();
    }
  }, [obraId, status, session]);

  const toggleFavorito = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== 'authenticated') {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }

    setIsLoading(true);

    try {
      const token = (session as any)?.backendToken;
      if (!token) {
        toast.error('No se encontró el token de autenticación');
        return;
      }

      if (isFavorito) {
        // Eliminar de favoritos
        const response = await fetch(`http://localhost:4000/api/favoritos/${obraId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          setIsFavorito(false);
          toast.success('Eliminado de favoritos');
        } else {
          const error = await response.json();
          toast.error(error.message || 'Error al eliminar de favoritos');
        }
      } else {
        // Agregar a favoritos
        const response = await fetch('http://localhost:4000/api/favoritos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ obra_id: obraId })
        });

        if (response.ok) {
          setIsFavorito(true);
          toast.success('Agregado a favoritos');
        } else {
          const error = await response.json();
          toast.error(error.message || 'Error al agregar a favoritos');
        }
      }
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // No mostrar si no está autenticado
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <button
      onClick={toggleFavorito}
      disabled={isLoading}
      className={`
        p-2 rounded-full transition-all duration-200
        ${isFavorito 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-600'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
        shadow-md backdrop-blur-sm
        ${className}
      `}
      title={isFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart 
        className={`w-5 h-5 ${isFavorito ? 'fill-current' : ''}`}
        strokeWidth={2}
      />
    </button>
  );
}
