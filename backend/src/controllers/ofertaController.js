const db = require('../database/db');
const { broadcastOferta, notifyOutbid } = require('../services/websocketService');

/**
 * Crear una nueva oferta
 * POST /api/ofertas
 */
exports.createOferta = async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { obra_id, monto, es_compra_inmediata = false } = req.body;
    const usuario_id = req.user.id;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent');

    // Validaciones básicas
    if (!obra_id || !monto) {
      return res.status(400).json({
        success: false,
        message: 'obra_id y monto son requeridos'
      });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    await client.query('BEGIN');

    // 1. Obtener y bloquear la obra para evitar race conditions
    const obraResult = await client.query(
      'SELECT * FROM obras WHERE id = $1 FOR UPDATE',
      [obra_id]
    );

    if (obraResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    const obra = obraResult.rows[0];

    // 2. Obtener precio actual y número de ofertas
    const ofertasResult = await client.query(
      `SELECT 
        COALESCE(MAX(monto), $1) as precio_actual,
        COUNT(*) as numero_ofertas
       FROM ofertas
       WHERE obra_id = $2 AND estado = 'ACTIVA'`,
      [obra.precio_base, obra_id]
    );

    const precioActual = parseFloat(ofertasResult.rows[0].precio_actual);
    const numeroOfertas = parseInt(ofertasResult.rows[0].numero_ofertas);

    // 3. Validar estado de la obra
    if (obra.estado !== 'ACTIVA') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'La obra no está activa para recibir ofertas'
      });
    }

    // 4. Validar que la subasta no haya cerrado    // 3. Validar que la subasta no haya cerrado
    const ahora = new Date();
    const fechaCierre = new Date(obra.fecha_cierre);
    
    if (ahora > fechaCierre) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'La subasta ha cerrado'
      });
    }

    // 5. Verificar que el usuario no sea el autor de la última oferta
    if (numeroOfertas > 0) {
      const ultimaOfertaResult = await client.query(
        `SELECT usuario_id FROM ofertas 
         WHERE obra_id = $1 AND estado = 'ACTIVA' 
         ORDER BY fecha_oferta DESC LIMIT 1`,
        [obra_id]
      );

      if (ultimaOfertaResult.rows.length > 0 && 
          ultimaOfertaResult.rows[0].usuario_id === usuario_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Ya tienes la oferta más alta'
        });
      }
    }

    let nuevaFechaCierre = fechaCierre;
    let tiempoExtendido = false;

    // 6. Manejar compra inmediata
    if (es_compra_inmediata) {
      if (!obra.precio_comprar_ahora) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Esta obra no tiene opción de compra inmediata'
        });
      }

      if (parseFloat(monto) < parseFloat(obra.precio_comprar_ahora)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `El monto debe ser al menos ${obra.precio_comprar_ahora} para compra inmediata`
        });
      }

      // Cerrar la subasta inmediatamente
      await client.query(
        'UPDATE obras SET estado = $1, fecha_cierre = NOW() WHERE id = $2',
        ['VENDIDA', obra_id]
      );

      // Marcar todas las ofertas anteriores como PERDIDAS
      await client.query(
        "UPDATE ofertas SET estado = 'PERDIDA' WHERE obra_id = $1 AND estado = 'ACTIVA'",
        [obra_id]
      );
    } else {
      // 6. Validar monto mínimo (precio_actual + incremento_minimo)
      const montoMinimo = precioActual + parseFloat(obra.incremento_minimo);
      
      if (parseFloat(monto) < montoMinimo) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `El monto mínimo de la oferta debe ser ${montoMinimo.toFixed(2)}`,
          data: {
            precio_actual: precioActual,
            incremento_minimo: parseFloat(obra.incremento_minimo),
            monto_minimo: montoMinimo
          }
        });
      }

      // 7. Extensión dinámica de tiempo (último minuto)
      const tiempoRestante = (fechaCierre - ahora) / 1000; // segundos
      
      if (tiempoRestante <= 60) { // Último minuto
        // Extender 2 minutos más
        nuevaFechaCierre = new Date(fechaCierre.getTime() + 2 * 60 * 1000);
        tiempoExtendido = true;

        await client.query(
          'UPDATE obras SET fecha_cierre = $1 WHERE id = $2',
          [nuevaFechaCierre, obra_id]
        );
      }

      // 8. Marcar ofertas anteriores como SUPERADAS
      if (numeroOfertas > 0) {
        await client.query(
          "UPDATE ofertas SET estado = 'SUPERADA' WHERE obra_id = $1 AND estado = 'ACTIVA'",
          [obra_id]
        );
      }
    }

    // 9. Crear la nueva oferta
    const ofertaResult = await client.query(
      `INSERT INTO ofertas (
        obra_id, usuario_id, monto, precio_anterior, 
        es_compra_inmediata, estado, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        obra_id,
        usuario_id,
        monto,
        precioActual,
        es_compra_inmediata,
        es_compra_inmediata ? 'GANADORA' : 'ACTIVA',
        ip_address,
        user_agent
      ]
    );

    const nuevaOferta = ofertaResult.rows[0];

    // 10. Obtener información completa del usuario para el broadcast
    const usuarioResult = await client.query(
      'SELECT id, nombre, email FROM usuarios WHERE id = $1',
      [usuario_id]
    );

    await client.query('COMMIT');

    // 11. Preparar respuesta
    const ofertaCompleta = {
      ...nuevaOferta,
      usuario: usuarioResult.rows[0],
      obra: {
        id: obra.id,
        nombre: obra.nombre,
        artista: obra.artista
      }
    };

    // 12. Broadcast por WebSocket a todos los clientes conectados
    broadcastOferta(obra_id, {
      oferta: ofertaCompleta,
      precio_actual: parseFloat(monto),
      numero_ofertas: numeroOfertas + 1,
      fecha_cierre: tiempoExtendido ? nuevaFechaCierre : fechaCierre,
      tiempo_extendido: tiempoExtendido,
      compra_inmediata: es_compra_inmediata
    });

    // 13. Notificar al postor anterior que fue superado (si existe)
    if (numeroOfertas > 0 && !es_compra_inmediata) {
      const ultimaOfertaResult = await db.query(
        `SELECT usuario_id FROM ofertas 
         WHERE obra_id = $1 AND estado = 'SUPERADA' 
         ORDER BY fecha_oferta DESC LIMIT 1`,
        [obra_id]
      );

      if (ultimaOfertaResult.rows.length > 0) {
        notifyOutbid(ultimaOfertaResult.rows[0].usuario_id, {
          obra_id,
          obra_nombre: obra.nombre,
          nuevo_precio: parseFloat(monto)
        });
      }
    }

    res.status(201).json({
      success: true,
      message: es_compra_inmediata 
        ? '¡Compra inmediata exitosa! Has ganado la obra' 
        : 'Oferta registrada exitosamente',
      data: ofertaCompleta,
      metadata: {
        precio_anterior: precioActual,
        precio_nuevo: parseFloat(monto),
        tiempo_extendido: tiempoExtendido,
        nueva_fecha_cierre: tiempoExtendido ? nuevaFechaCierre : null
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear oferta',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Listar ofertas de una obra
 * GET /api/ofertas/obra/:obraId
 */
exports.getOfertasByObra = async (req, res) => {
  try {
    const { obraId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        o.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email
       FROM ofertas o
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE o.obra_id = $1
       ORDER BY o.fecha_oferta DESC
       LIMIT $2 OFFSET $3`,
      [obraId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM ofertas WHERE obra_id = $1',
      [obraId]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error al listar ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar ofertas',
      error: error.message
    });
  }
};

/**
 * Obtener oferta ganadora de una obra
 * GET /api/ofertas/obra/:obraId/ganadora
 */
exports.getOfertaGanadora = async (req, res) => {
  try {
    const { obraId } = req.params;

    const result = await db.query(
      `SELECT 
        o.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email
       FROM ofertas o
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE o.obra_id = $1 AND o.estado IN ('ACTIVA', 'GANADORA')
       ORDER BY o.monto DESC, o.fecha_oferta ASC
       LIMIT 1`,
      [obraId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay ofertas para esta obra'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener oferta ganadora:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener oferta ganadora',
      error: error.message
    });
  }
};

/**
 * Obtener historial de ofertas del usuario autenticado
 * GET /api/ofertas/mis-ofertas
 */
exports.getMisOfertas = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { limit = 50, offset = 0, estado } = req.query;

    let query = `
      SELECT 
        o.*,
        ob.nombre as obra_nombre,
        ob.artista as obra_artista,
        ob.imagen_principal as obra_imagen,
        ob.estado as obra_estado
      FROM ofertas o
      JOIN obras ob ON ob.id = o.obra_id
      WHERE o.usuario_id = $1
    `;

    const params = [usuario_id];

    if (estado) {
      params.push(estado);
      query += ` AND o.estado = $${params.length}`;
    }

    query += ` ORDER BY o.fecha_oferta DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(*) as total FROM ofertas 
      WHERE usuario_id = $1 ${estado ? 'AND estado = $2' : ''}
    `;
    const countParams = estado ? [usuario_id, estado] : [usuario_id];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error al obtener mis ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ofertas',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de ofertas del usuario
 * GET /api/ofertas/mis-estadisticas
 */
exports.getMisEstadisticas = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_ofertas,
        COUNT(DISTINCT obra_id) as obras_participadas,
        SUM(CASE WHEN estado = 'ACTIVA' THEN 1 ELSE 0 END) as ofertas_activas,
        SUM(CASE WHEN estado = 'GANADORA' THEN 1 ELSE 0 END) as ofertas_ganadoras,
        SUM(CASE WHEN estado = 'SUPERADA' THEN 1 ELSE 0 END) as ofertas_superadas,
        MAX(monto) as oferta_maxima,
        AVG(monto) as oferta_promedio
       FROM ofertas
       WHERE usuario_id = $1`,
      [usuario_id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * [ADMIN] Listar todas las ofertas con filtros
 * GET /api/admin/ofertas
 */
exports.getAllOfertas = async (req, res) => {
  try {
    const { limit = 50, offset = 0, obra_id, usuario_id, estado } = req.query;

    let query = `
      SELECT 
        o.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        ob.nombre as obra_nombre,
        ob.artista as obra_artista
      FROM ofertas o
      JOIN usuarios u ON u.id = o.usuario_id
      JOIN obras ob ON ob.id = o.obra_id
      WHERE 1=1
    `;

    const params = [];

    if (obra_id) {
      params.push(obra_id);
      query += ` AND o.obra_id = $${params.length}`;
    }

    if (usuario_id) {
      params.push(usuario_id);
      query += ` AND o.usuario_id = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      query += ` AND o.estado = $${params.length}`;
    }

    query += ` ORDER BY o.fecha_oferta DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM ofertas WHERE 1=1';
    const countParams = [];

    if (obra_id) {
      countParams.push(obra_id);
      countQuery += ` AND obra_id = $${countParams.length}`;
    }

    if (usuario_id) {
      countParams.push(usuario_id);
      countQuery += ` AND usuario_id = $${countParams.length}`;
    }

    if (estado) {
      countParams.push(estado);
      countQuery += ` AND estado = $${countParams.length}`;
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error al listar ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar ofertas',
      error: error.message
    });
  }
};

/**
 * [ADMIN] Cancelar una oferta (en casos excepcionales)
 * DELETE /api/admin/ofertas/:id
 */
exports.cancelarOferta = async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    await client.query('BEGIN');

    // Obtener oferta
    const ofertaResult = await client.query(
      'SELECT * FROM ofertas WHERE id = $1',
      [id]
    );

    if (ofertaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    const oferta = ofertaResult.rows[0];

    // Marcar como perdida
    await client.query(
      "UPDATE ofertas SET estado = 'PERDIDA' WHERE id = $1",
      [id]
    );

    // Si era la oferta activa, reactivar la anterior
    if (oferta.estado === 'ACTIVA') {
      await client.query(
        `UPDATE ofertas SET estado = 'ACTIVA' 
         WHERE obra_id = $1 AND id != $2 AND estado = 'SUPERADA'
         AND fecha_oferta = (
           SELECT MAX(fecha_oferta) FROM ofertas 
           WHERE obra_id = $1 AND id != $2 AND estado = 'SUPERADA'
         )`,
        [oferta.obra_id, id]
      );
    }

    await client.query('COMMIT');

    // Notificar por WebSocket
    broadcastOferta(oferta.obra_id, {
      tipo: 'oferta_cancelada',
      oferta_id: id,
      motivo
    });

    res.json({
      success: true,
      message: 'Oferta cancelada exitosamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al cancelar oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar oferta',
      error: error.message
    });
  } finally {
    client.release();
  }
};
