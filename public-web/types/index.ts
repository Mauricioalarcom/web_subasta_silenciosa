// Tipos de usuario
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'USUARIO' | 'ADMIN';
  foto_perfil?: string;
  provider?: string;
  created_at: string;
}

// Tipos de obra
export interface Obra {
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
  estado: 'ACTIVA' | 'VENDIDA' | 'NO_VENDIDA' | 'PAUSADA';
  created_at: string;
}

// Tipos de oferta
export interface Oferta {
  id: string;
  obra_id: string;
  usuario_id: string;
  monto: number;
  estado: 'ACTIVA' | 'SUPERADA' | 'GANADORA' | 'PERDIDA';
  es_compra_inmediata: boolean;
  fecha_oferta: string;
  usuario_nombre?: string;
  usuario_email?: string;
  obra_nombre?: string;
}

// Tipos de favorito
export interface Favorito {
  id: string;
  usuario_id: string;
  obra_id: string;
  created_at: string;
  obra?: Obra;
}

// Tipos de pago
export interface Pago {
  id: string;
  oferta_id: string;
  usuario_id: string;
  obra_id: string;
  monto: number;
  metodo_pago: 'CASH' | 'TRANSFERENCIA' | 'TARJETA';
  estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
  referencia_pago?: string;
  fecha_pago?: string;
  created_at: string;
  obra?: Obra;
}

// Tipos de respuesta API
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Tipos de WebSocket
export interface WSObraEstado {
  obra: Obra;
  precio_actual: number;
  numero_ofertas: number;
  tiempo_restante: number;
}

export interface WSNuevaOferta {
  oferta: Oferta;
  precio_actual: number;
  numero_ofertas: number;
  fecha_cierre: string;
  tiempo_extendido: boolean;
  compra_inmediata: boolean;
}

export interface WSSuperado {
  obra_id: string;
  obra_nombre: string;
  nuevo_precio: number;
  oferta_anterior: number;
}

export interface WSSubastaCerrada {
  obra_id: string;
  obra_nombre: string;
  ganador?: {
    usuario_id: string;
    usuario_nombre: string;
    monto_final: number;
  };
}
