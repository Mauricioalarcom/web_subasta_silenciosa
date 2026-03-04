import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ObraEstado {
  obra: {
    id: string;
    nombre: string;
    artista: string;
    estado: string;
    precio_base: number;
    incremento_minimo: number;
    precio_comprar_ahora: number | null;
    fecha_cierre: string;
    imagen_principal: string;
  };
  precio_actual: number;
  numero_ofertas: number;
  tiempo_restante_segundos: number;
  ultima_oferta: {
    id: string;
    monto: string;
    usuario_nombre: string;
    fecha_oferta: string;
  } | null;
}

interface NuevaOferta {
  oferta: {
    id: string;
    monto: string;
    usuario: {
      id: string;
      nombre: string;
    };
  };
  precio_actual: number;
  numero_ofertas: number;
  fecha_cierre: string;
  tiempo_extendido: boolean;
  compra_inmediata: boolean;
}

interface SuperadoData {
  obra_id: string;
  obra_nombre: string;
  nuevo_precio: number;
}

interface SubastaCerrada {
  obra_id: string;
  ganador: {
    usuario_id: string;
    usuario_nombre: string;
    monto_final: number;
  } | null;
}

interface ExtensionTiempo {
  obra_id: string;
  nueva_fecha_cierre: string;
  segundos_extendidos: number;
}

interface AdvertenciaCierre {
  obra_id: string;
  obra_nombre: string;
  segundos_restantes: number;
  mensaje: string;
}

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener token de autenticación (usuarios públicos)
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    // Conectar a Socket.io
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Event: Conexión exitosa
    socket.on('connect', () => {
      console.log('🔌 WebSocket conectado:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    // Event: Error de conexión
    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Event: Desconexión
    socket.on('disconnect', (reason) => {
      console.log('🔴 WebSocket desconectado:', reason);
      setIsConnected(false);
    });

    // Event: Reconexión
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconectado después de', attemptNumber, 'intentos');
      setIsConnected(true);
      setConnectionError(null);
    });

    // Pong para mantener conexión
    socket.on('pong', () => {
      // Respuesta al ping
    });

    // Cleanup al desmontar
    return () => {
      console.log('👋 Cerrando conexión WebSocket');
      socket.disconnect();
    };
  }, []);

  // Unirse a sala de obra
  const joinObra = useCallback((obraId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_obra', obraId);
      console.log(`📦 Uniéndose a sala: obra:${obraId}`);
    }
  }, [isConnected]);

  // Salir de sala de obra
  const leaveObra = useCallback((obraId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_obra', obraId);
      console.log(`📤 Saliendo de sala: obra:${obraId}`);
    }
  }, [isConnected]);

  // Listener: Estado inicial de obra
  const onObraEstado = useCallback((callback: (data: ObraEstado) => void) => {
    if (socketRef.current) {
      socketRef.current.on('obra_estado', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('obra_estado', callback);
      }
    };
  }, []);

  // Listener: Nueva oferta
  const onNuevaOferta = useCallback((callback: (data: NuevaOferta) => void) => {
    if (socketRef.current) {
      socketRef.current.on('nueva_oferta', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('nueva_oferta', callback);
      }
    };
  }, []);

  // Listener: Fuiste superado
  const onSuperado = useCallback((callback: (data: SuperadoData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('superado', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('superado', callback);
      }
    };
  }, []);

  // Listener: Subasta cerrada
  const onSubastaCerrada = useCallback((callback: (data: SubastaCerrada) => void) => {
    if (socketRef.current) {
      socketRef.current.on('subasta_cerrada', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('subasta_cerrada', callback);
      }
    };
  }, []);

  // Listener: Ganaste
  const onGanaste = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('ganaste', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('ganaste', callback);
      }
    };
  }, []);

  // Listener: Extensión de tiempo
  const onExtensionTiempo = useCallback((callback: (data: ExtensionTiempo) => void) => {
    if (socketRef.current) {
      socketRef.current.on('extension_tiempo', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('extension_tiempo', callback);
      }
    };
  }, []);

  // Listener: Advertencia de cierre
  const onAdvertenciaCierre = useCallback((callback: (data: AdvertenciaCierre) => void) => {
    if (socketRef.current) {
      socketRef.current.on('advertencia_cierre', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('advertencia_cierre', callback);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinObra,
    leaveObra,
    onObraEstado,
    onNuevaOferta,
    onSuperado,
    onSubastaCerrada,
    onGanaste,
    onExtensionTiempo,
    onAdvertenciaCierre
  };
};
