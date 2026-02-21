const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');

let io = null;
const userSockets = new Map(); // Map para rastrear sockets por usuario

/**
 * Inicializar el servicio de WebSocket
 */
const initializeWebSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', async (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Autenticar usuario (opcional pero recomendado)
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.match(/auth_token=([^;]+)/)?.[1];
    
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        userId = decoded.id;
        socket.userId = userId;
        socket.isAdmin = decoded.rol === 'ADMIN';

        // Guardar socket del usuario
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        // Unirse a room personal del usuario
        socket.join(`user:${userId}`);
        
        // Si es admin, unirse al room de admins
        if (socket.isAdmin) {
          socket.join('admin');
          console.log(`👑 Admin conectado: ${userId} (socket: ${socket.id})`);
        }
        
        console.log(`✅ Usuario autenticado: ${userId} (socket: ${socket.id})`);
      } catch (error) {
        console.log(`⚠️ Token inválido en socket ${socket.id}`);
      }
    }

    // Evento: Usuario se une a una sala de obra específica
    socket.on('join_obra', async (obraId) => {
      try {
        socket.join(`obra:${obraId}`);
        console.log(`📦 Socket ${socket.id} se unió a obra:${obraId}`);

        // Enviar estado actual de la obra al cliente
        const obraData = await getObraEstado(obraId);
        socket.emit('obra_estado', obraData);
      } catch (error) {
        console.error('Error al unirse a obra:', error);
        socket.emit('error', { message: 'Error al unirse a la sala' });
      }
    });

    // Evento: Usuario sale de una sala de obra
    socket.on('leave_obra', (obraId) => {
      socket.leave(`obra:${obraId}`);
      console.log(`📤 Socket ${socket.id} salió de obra:${obraId}`);
    });

    // Evento: Ping para mantener conexión activa
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Evento: Desconexión
    socket.on('disconnect', () => {
      console.log(`🔴 Cliente desconectado: ${socket.id}`);
      
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  // Iniciar verificación periódica de subastas que cierran
  startAuctionMonitor();

  console.log('✅ WebSocket service initialized');
};

/**
 * Obtener estado actual de una obra con ofertas
 */
const getObraEstado = async (obraId) => {
  try {
    const result = await db.query(
      `SELECT 
        o.*,
        COALESCE(MAX(of.monto), o.precio_base) as precio_actual,
        COUNT(of.id) as numero_ofertas,
        CASE 
          WHEN o.fecha_cierre > NOW() THEN EXTRACT(EPOCH FROM (o.fecha_cierre - NOW()))
          ELSE 0
        END as tiempo_restante_segundos
       FROM obras o
       LEFT JOIN ofertas of ON of.obra_id = o.id AND of.estado IN ('ACTIVA', 'GANADORA')
       WHERE o.id = $1
       GROUP BY o.id`,
      [obraId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const obra = result.rows[0];

    // Obtener última oferta
    let ultimaOferta = null;
    if (obra.numero_ofertas > 0) {
      const ofertaResult = await db.query(
        `SELECT 
          o.*,
          u.nombre as usuario_nombre
         FROM ofertas o
         JOIN usuarios u ON u.id = o.usuario_id
         WHERE o.obra_id = $1 AND o.estado IN ('ACTIVA', 'GANADORA')
         ORDER BY o.monto DESC, o.fecha_oferta ASC
         LIMIT 1`,
        [obraId]
      );

      if (ofertaResult.rows.length > 0) {
        ultimaOferta = ofertaResult.rows[0];
      }
    }

    return {
      obra: {
        id: obra.id,
        nombre: obra.nombre,
        artista: obra.artista,
        estado: obra.estado,
        precio_base: parseFloat(obra.precio_base),
        incremento_minimo: parseFloat(obra.incremento_minimo),
        precio_comprar_ahora: obra.precio_comprar_ahora ? parseFloat(obra.precio_comprar_ahora) : null,
        fecha_cierre: obra.fecha_cierre,
        imagen_principal: obra.imagen_principal
      },
      precio_actual: parseFloat(obra.precio_actual),
      numero_ofertas: parseInt(obra.numero_ofertas),
      tiempo_restante_segundos: parseFloat(obra.tiempo_restante_segundos),
      ultima_oferta: ultimaOferta
    };
  } catch (error) {
    console.error('Error al obtener estado de obra:', error);
    return null;
  }
};

/**
 * Broadcast de nueva oferta a todos los clientes viendo esa obra
 */
const broadcastOferta = (obraId, data) => {
  if (!io) {
    console.warn('WebSocket no inicializado');
    return;
  }

  io.to(`obra:${obraId}`).emit('nueva_oferta', {
    timestamp: new Date().toISOString(),
    ...data
  });

  console.log(`📡 Broadcast de oferta a obra:${obraId}`);
};

/**
 * Notificar a un usuario específico que fue superado
 */
const notifyOutbid = (userId, data) => {
  if (!io) {
    console.warn('WebSocket no inicializado');
    return;
  }

  io.to(`user:${userId}`).emit('superado', {
    timestamp: new Date().toISOString(),
    message: 'Tu oferta ha sido superada',
    ...data
  });

  console.log(`🔔 Notificación de superación enviada a user:${userId}`);
};

/**
 * Notificar cierre de subasta
 */
const notifyCierreSubasta = (obraId, ganador) => {
  if (!io) return;

  io.to(`obra:${obraId}`).emit('subasta_cerrada', {
    timestamp: new Date().toISOString(),
    obra_id: obraId,
    ganador: ganador ? {
      usuario_id: ganador.usuario_id,
      usuario_nombre: ganador.usuario_nombre,
      monto_final: parseFloat(ganador.monto)
    } : null
  });

  // Notificar al ganador
  if (ganador) {
    io.to(`user:${ganador.usuario_id}`).emit('ganaste', {
      timestamp: new Date().toISOString(),
      obra_id: obraId,
      monto_final: parseFloat(ganador.monto)
    });
  }

  console.log(`🏁 Subasta cerrada para obra:${obraId}`);
};

/**
 * Notificar extensión de tiempo
 */
const notifyExtensionTiempo = (obraId, nuevaFechaCierre, segundosExtendidos) => {
  if (!io) return;

  io.to(`obra:${obraId}`).emit('extension_tiempo', {
    timestamp: new Date().toISOString(),
    obra_id: obraId,
    nueva_fecha_cierre: nuevaFechaCierre,
    segundos_extendidos: segundosExtendidos
  });

  console.log(`⏰ Extensión de tiempo notificada para obra:${obraId}`);
};

/**
 * Monitor que verifica subastas que están por cerrar
 * Se ejecuta cada 10 segundos
 */
const startAuctionMonitor = () => {
  setInterval(async () => {
    try {
      // Buscar obras que cierran en los próximos 30 segundos
      const result = await db.query(
        `SELECT id, nombre, fecha_cierre 
         FROM obras 
         WHERE estado = 'ACTIVA' 
         AND fecha_cierre > NOW() 
         AND fecha_cierre <= NOW() + INTERVAL '30 seconds'`
      );

      for (const obra of result.rows) {
        const tiempoRestante = Math.floor((new Date(obra.fecha_cierre) - new Date()) / 1000);
        
        io.to(`obra:${obra.id}`).emit('advertencia_cierre', {
          timestamp: new Date().toISOString(),
          obra_id: obra.id,
          obra_nombre: obra.nombre,
          segundos_restantes: tiempoRestante,
          mensaje: `⏰ ¡La subasta cierra en ${tiempoRestante} segundos!`
        });
      }

      // Cerrar subastas que ya pasaron su fecha de cierre
      const subastasCerradas = await db.query(
        `SELECT 
          o.id,
          o.nombre,
          of.id as oferta_id,
          of.usuario_id,
          of.monto,
          u.nombre as usuario_nombre
         FROM obras o
         LEFT JOIN ofertas of ON of.obra_id = o.id AND of.estado = 'ACTIVA'
         LEFT JOIN usuarios u ON u.id = of.usuario_id
         WHERE o.estado = 'ACTIVA' 
         AND o.fecha_cierre <= NOW()
         ORDER BY of.monto DESC NULLS LAST
         LIMIT 1`
      );

      for (const obra of subastasCerradas.rows) {
        // Actualizar estado de la obra
        await db.query(
          "UPDATE obras SET estado = $1 WHERE id = $2",
          [obra.oferta_id ? 'VENDIDA' : 'NO_VENDIDA', obra.id]
        );

        // Marcar oferta ganadora
        if (obra.oferta_id) {
          await db.query(
            "UPDATE ofertas SET estado = 'GANADORA' WHERE id = $1",
            [obra.oferta_id]
          );

          // Marcar otras ofertas como perdidas
          await db.query(
            "UPDATE ofertas SET estado = 'PERDIDA' WHERE obra_id = $1 AND id != $2",
            [obra.id, obra.oferta_id]
          );

          notifyCierreSubasta(obra.id, {
            usuario_id: obra.usuario_id,
            usuario_nombre: obra.usuario_nombre,
            monto: obra.monto
          });
        } else {
          notifyCierreSubasta(obra.id, null);
        }
      }
    } catch (error) {
      console.error('Error en auction monitor:', error);
    }
  }, 10000); // Cada 10 segundos

  console.log('⏰ Auction monitor iniciado (cada 10s)');
};

/**
 * Obtener usuarios conectados en una obra
 */
const getConnectedUsers = (obraId) => {
  if (!io) return 0;
  
  const room = io.sockets.adapter.rooms.get(`obra:${obraId}`);
  return room ? room.size : 0;
};

/**
 * Obtener total de clientes conectados
 */
const getTotalConnected = () => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};

/**
 * Notificar actualización de dashboard a admins
 */
const notifyDashboardUpdate = (data) => {
  if (!io) return;
  
  // Emitir a todos los admins conectados (room 'admin')
  io.to('admin').emit('dashboard_update', {
    ...data,
    timestamp: new Date().toISOString()
  });
  
  console.log('📊 Dashboard update enviado a admins');
};

/**
 * Notificar nueva oferta al dashboard
 */
const notifyDashboardNewOferta = (ofertaData) => {
  if (!io) return;
  
  io.to('admin').emit('dashboard_nueva_oferta', {
    obra_id: ofertaData.obra_id,
    obra_nombre: ofertaData.obra_nombre,
    usuario_nombre: ofertaData.usuario_nombre,
    monto: ofertaData.monto,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  initializeWebSocket,
  broadcastOferta,
  notifyOutbid,
  notifyCierreSubasta,
  notifyExtensionTiempo,
  getConnectedUsers,
  getTotalConnected,
  getObraEstado,
  notifyDashboardUpdate,
  notifyDashboardNewOferta
};
