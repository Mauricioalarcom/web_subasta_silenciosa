const db = require('../database/db');
const path = require('path');

/**
 * Listar todos los pagos con filtros
 */
const listPagos = async (req, res) => {
  try {
    const {
      estado_pago,
      estado_entrega,
      metodo,
      usuario_id,
      page = 1,
      limit = 20,
      order_by = 'created_at',
      order_dir = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        p.*,
        o.nombre as obra_nombre,
        o.artista as obra_artista,
        o.imagen_principal as obra_imagen,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.telefono as usuario_telefono,
        uc.nombre as confirmado_por_nombre,
        ue.nombre as entregado_por_nombre,
        COUNT(*) OVER() as total_count
      FROM pagos p
      INNER JOIN obras o ON p.obra_id = o.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN usuarios uc ON p.confirmado_por = uc.id
      LEFT JOIN usuarios ue ON p.entregado_por = ue.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (estado_pago) {
      query += ` AND p.estado_pago = $${paramCount++}`;
      params.push(estado_pago);
    }

    if (estado_entrega) {
      query += ` AND p.estado_entrega = $${paramCount++}`;
      params.push(estado_entrega);
    }

    if (metodo) {
      query += ` AND p.metodo = $${paramCount++}`;
      params.push(metodo);
    }

    if (usuario_id) {
      query += ` AND p.usuario_id = $${paramCount++}`;
      params.push(usuario_id);
    }

    // Validar order_by
    const validOrderFields = ['created_at', 'fecha_pago', 'fecha_confirmacion', 'monto', 'estado_pago', 'estado_entrega'];
    const orderField = validOrderFields.includes(order_by) ? order_by : 'created_at';
    const orderDirection = order_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY p.${orderField} ${orderDirection}`;

    // Paginación
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const pagos = result.rows.map(row => {
      const { total_count, ...pago } = row;
      return pago;
    });

    res.json({
      success: true,
      data: pagos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

/**
 * Obtener un pago específico
 */
const getPago = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        p.*,
        o.nombre as obra_nombre,
        o.artista as obra_artista,
        o.imagen_principal as obra_imagen,
        o.precio_actual as precio_final,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.telefono as usuario_telefono,
        uc.nombre as confirmado_por_nombre,
        uc.email as confirmado_por_email,
        ue.nombre as entregado_por_nombre,
        ue.email as entregado_por_email
      FROM pagos p
      INNER JOIN obras o ON p.obra_id = o.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN usuarios uc ON p.confirmado_por = uc.id
      LEFT JOIN usuarios ue ON p.entregado_por = ue.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

/**
 * Crear registro de pago (cuando se gana la subasta)
 */
const createPago = async (req, res) => {
  try {
    const { obra_id, usuario_id, monto } = req.body;

    if (!obra_id || !usuario_id || !monto) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: obra_id, usuario_id, monto'
      });
    }

    // Verificar que la obra existe y está vendida
    const obraResult = await db.query(
      'SELECT * FROM obras WHERE id = $1',
      [obra_id]
    );

    if (obraResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    const obra = obraResult.rows[0];

    if (obra.estado !== 'VENDIDA') {
      return res.status(400).json({
        success: false,
        message: 'La obra debe estar en estado VENDIDA para crear un pago'
      });
    }

    if (obra.mejor_postor_id !== usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es el ganador de esta obra'
      });
    }

    // Verificar que no exista ya un pago para esta obra
    const pagoExistente = await db.query(
      'SELECT id FROM pagos WHERE obra_id = $1 AND usuario_id = $2',
      [obra_id, usuario_id]
    );

    if (pagoExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un registro de pago para esta obra y usuario'
      });
    }

    // Crear pago
    const result = await db.query(`
      INSERT INTO pagos (obra_id, usuario_id, monto, estado_pago, estado_entrega)
      VALUES ($1, $2, $3, 'PENDIENTE', 'PENDIENTE')
      RETURNING *
    `, [obra_id, usuario_id, monto]);

    res.status(201).json({
      success: true,
      message: 'Registro de pago creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pago',
      error: error.message
    });
  }
};

/**
 * Seleccionar método de pago
 */
const selectMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo } = req.body;

    const validMetodos = ['CASH', 'TRANSFERENCIA', 'TARJETA'];
    
    if (!metodo || !validMetodos.includes(metodo)) {
      return res.status(400).json({
        success: false,
        message: `Método de pago inválido. Opciones: ${validMetodos.join(', ')}`
      });
    }

    // Verificar que el pago existe
    const pagoResult = await db.query('SELECT * FROM pagos WHERE id = $1', [id]);
    
    if (pagoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    const pago = pagoResult.rows[0];

    if (pago.estado_pago === 'CONFIRMADO') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el método de un pago ya confirmado'
      });
    }

    // Actualizar método de pago
    const result = await db.query(`
      UPDATE pagos 
      SET metodo = $1, 
          estado_pago = 'PROCESANDO',
          fecha_pago = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [metodo, id]);

    // Si es CASH o TRANSFERENCIA, devolver información de contacto
    let contactInfo = null;
    
    if (metodo === 'CASH' || metodo === 'TRANSFERENCIA') {
      // Obtener info de contacto del evento
      const eventoResult = await db.query(`
        SELECT email_contacto, telefono_contacto 
        FROM evento 
        WHERE estado = 'ACTIVO' 
        LIMIT 1
      `);

      if (eventoResult.rows.length > 0) {
        const evento = eventoResult.rows[0];
        contactInfo = {
          email: evento.email_contacto,
          telefono: evento.telefono_contacto,
          whatsapp: evento.telefono_contacto ? `https://wa.me/${evento.telefono_contacto.replace(/[^0-9]/g, '')}` : null,
          message: metodo === 'CASH' 
            ? 'Por favor, contacta al administrador para coordinar el pago en efectivo.'
            : 'Por favor, realiza la transferencia y envía el comprobante por WhatsApp al número indicado.'
        };
      }
    }

    res.json({
      success: true,
      message: 'Método de pago seleccionado exitosamente',
      data: result.rows[0],
      contactInfo
    });
  } catch (error) {
    console.error('Error al seleccionar método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al seleccionar método de pago',
      error: error.message
    });
  }
};

/**
 * Subir comprobante de pago
 */
const uploadComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió comprobante'
      });
    }

    const comprobanteUrl = `/uploads/${req.file.filename}`;

    // Actualizar pago
    const result = await db.query(`
      UPDATE pagos 
      SET comprobante_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [comprobanteUrl, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Comprobante subido exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al subir comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir comprobante',
      error: error.message
    });
  }
};

/**
 * Confirmar pago (solo admin)
 */
const confirmarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas_internas } = req.body;
    const adminId = req.user.id; // Del middleware de autenticación

    // Verificar que el pago existe
    const pagoResult = await db.query('SELECT * FROM pagos WHERE id = $1', [id]);
    
    if (pagoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    const pago = pagoResult.rows[0];

    if (pago.estado_pago === 'CONFIRMADO') {
      return res.status(400).json({
        success: false,
        message: 'El pago ya está confirmado'
      });
    }

    // Confirmar pago
    const result = await db.query(`
      UPDATE pagos 
      SET estado_pago = 'CONFIRMADO',
          fecha_confirmacion = NOW(),
          confirmado_por = $1,
          notas_internas = $2,
          estado_entrega = 'EN_PREPARACION',
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [adminId, notas_internas || null, id]);

    res.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar pago',
      error: error.message
    });
  }
};

/**
 * Rechazar pago (solo admin)
 */
const rechazarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon_rechazo } = req.body;

    if (!razon_rechazo) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar una razón de rechazo'
      });
    }

    // Verificar que el pago existe
    const pagoResult = await db.query('SELECT * FROM pagos WHERE id = $1', [id]);
    
    if (pagoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Rechazar pago
    const result = await db.query(`
      UPDATE pagos 
      SET estado_pago = 'RECHAZADO',
          razon_rechazo = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [razon_rechazo, id]);

    res.json({
      success: true,
      message: 'Pago rechazado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar pago',
      error: error.message
    });
  }
};

/**
 * Actualizar estado de entrega
 */
const updateEstadoEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_entrega, notas_entrega } = req.body;
    const adminId = req.user.id;

    const validEstados = ['PENDIENTE', 'EN_PREPARACION', 'LISTA_PARA_RECOGER', 'ENTREGADA'];
    
    if (!estado_entrega || !validEstados.includes(estado_entrega)) {
      return res.status(400).json({
        success: false,
        message: `Estado de entrega inválido. Opciones: ${validEstados.join(', ')}`
      });
    }

    // Verificar que el pago existe y está confirmado
    const pagoResult = await db.query('SELECT * FROM pagos WHERE id = $1', [id]);
    
    if (pagoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    const pago = pagoResult.rows[0];

    if (pago.estado_pago !== 'CONFIRMADO') {
      return res.status(400).json({
        success: false,
        message: 'El pago debe estar confirmado para actualizar el estado de entrega'
      });
    }

    // Actualizar estado de entrega
    let query = `
      UPDATE pagos 
      SET estado_entrega = $1,
          notas_entrega = $2,
          updated_at = NOW()
    `;
    
    const params = [estado_entrega, notas_entrega || null];

    // Si se marca como entregada, registrar fecha y quien entregó
    if (estado_entrega === 'ENTREGADA') {
      query += `, fecha_entrega = NOW(), entregado_por = $3 WHERE id = $4`;
      params.push(adminId, id);
    } else {
      query += ` WHERE id = $3`;
      params.push(id);
    }

    query += ' RETURNING *';

    const result = await db.query(query, params);

    res.json({
      success: true,
      message: 'Estado de entrega actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado de entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de entrega',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de pagos
 */
const getEstadisticasPagos = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado_pago = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado_pago = 'PROCESANDO') as procesando,
        COUNT(*) FILTER (WHERE estado_pago = 'CONFIRMADO') as confirmados,
        COUNT(*) FILTER (WHERE estado_pago = 'RECHAZADO') as rechazados,
        SUM(monto) FILTER (WHERE estado_pago = 'CONFIRMADO') as total_confirmado,
        SUM(monto) FILTER (WHERE estado_pago IN ('PENDIENTE', 'PROCESANDO')) as total_pendiente,
        COUNT(*) FILTER (WHERE estado_entrega = 'PENDIENTE') as entregas_pendientes,
        COUNT(*) FILTER (WHERE estado_entrega = 'EN_PREPARACION') as entregas_preparacion,
        COUNT(*) FILTER (WHERE estado_entrega = 'LISTA_PARA_RECOGER') as entregas_listas,
        COUNT(*) FILTER (WHERE estado_entrega = 'ENTREGADA') as entregas_completadas
      FROM pagos
    `);

    const stats = result.rows[0];

    // Obtener distribución por método de pago
    const metodoResult = await db.query(`
      SELECT 
        metodo,
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM pagos
      WHERE metodo IS NOT NULL
      GROUP BY metodo
    `);

    res.json({
      success: true,
      data: {
        resumen: {
          pendientes: parseInt(stats.pendientes) || 0,
          procesando: parseInt(stats.procesando) || 0,
          confirmados: parseInt(stats.confirmados) || 0,
          rechazados: parseInt(stats.rechazados) || 0,
          total_confirmado: parseFloat(stats.total_confirmado) || 0,
          total_pendiente: parseFloat(stats.total_pendiente) || 0
        },
        entregas: {
          pendientes: parseInt(stats.entregas_pendientes) || 0,
          preparacion: parseInt(stats.entregas_preparacion) || 0,
          listas: parseInt(stats.entregas_listas) || 0,
          completadas: parseInt(stats.entregas_completadas) || 0
        },
        por_metodo: metodoResult.rows.map(row => ({
          metodo: row.metodo,
          cantidad: parseInt(row.cantidad),
          total: parseFloat(row.total)
        }))
      }
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

module.exports = {
  listPagos,
  getPago,
  createPago,
  selectMetodoPago,
  uploadComprobante,
  confirmarPago,
  rechazarPago,
  updateEstadoEntrega,
  getEstadisticasPagos
};
