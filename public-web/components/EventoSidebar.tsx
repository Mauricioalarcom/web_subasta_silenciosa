'use client';

import { useState, useEffect } from 'react';
import { publicAPI } from '@/lib/api';
import { Calendar, MapPin, Clock, Info } from 'lucide-react';

interface Evento {
  id: string;
  nombre: string;
  organizacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_cierre: string;
  logo_url: string | null;
  banner_url: string | null;
  estado: string;
  mensaje_bienvenida?: string;
}

export default function EventoSidebar() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvento();
  }, []);

  const loadEvento = async () => {
    try {
      const response = await publicAPI.get('/api/evento');
      if (response.data.success) {
        setEvento(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!evento) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = () => {
    const now = new Date();
    const inicio = new Date(evento.fecha_inicio);
    const cierre = new Date(evento.fecha_cierre);

    if (now < inicio) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
          <Clock className="w-4 h-4" />
          Próximamente
        </span>
      );
    } else if (now >= inicio && now <= cierre) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          En vivo
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
          Finalizado
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-4">
      {/* Logo o banner */}
      {evento.logo_url && (
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${evento.logo_url}`}
            alt={evento.nombre}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Título y estado */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {evento.nombre}
          </h2>
          {getEstadoBadge()}
        </div>

        {/* Descripción */}
        {evento.descripcion && (
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">
              {evento.descripcion}
            </p>
          </div>
        )}

        {/* Fechas */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">Inicio</p>
              <p className="text-gray-600">{formatDate(evento.fecha_inicio)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-pink-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">Finalización</p>
              <p className="text-gray-600">{formatDate(evento.fecha_cierre)}</p>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        {evento.organizacion && (
          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">Organizador</p>
              <p className="text-gray-600">{evento.organizacion}</p>
            </div>
          </div>
        )}

        {/* Info adicional */}
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm">
          <p className="text-purple-900 font-medium mb-1">
            💡 ¿Cómo participar?
          </p>
          <p className="text-purple-700 text-xs leading-relaxed">
            Explora las obras, haz ofertas en tiempo real y recibe notificaciones cuando seas superado. ¡Buena suerte!
          </p>
        </div>
      </div>
    </div>
  );
}
