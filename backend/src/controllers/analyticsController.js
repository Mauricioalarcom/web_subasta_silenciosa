const db = require('../database/db');

/**
 * @desc    Obtener estadísticas generales del dashboard
 * @route   GET /api/admin/analytics/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total recaudado (suma de ofertas ganadoras)
    const recaudadoQuery = `
      SELECT COALESCE(SUM(o.monto), 0) as total_recaudado
      FROM ofertas o
      WHERE o.estado = 'GANADORA'
    `;
    const recaudadoResult = await db.query(recaudadoQuery);
    const totalRecaudado = parseFloat(recaudadoResult.rows[0].total_recaudado);

    // 2. Obras activas
    const obrasQuery = `
      SELECT 
        COUNT(CASE WHEN estado = 'ACTIVA' THEN 1 END) as activas,
        COUNT(CASE WHEN estado = 'VENDIDA' THEN 1 END) as vendidas,
        COUNT(CASE WHEN estado = 'NO_VENDIDA' THEN 1 END) as no_vendidas,
        COUNT(CASE WHEN estado = 'PAUSADA' THEN 1 END) as pausadas,
        COUNT(*) as total
      FROM obras
    `;
    const obrasResult = await db.query(obrasQuery);
    const obrasStats = obrasResult.rows[0];

    // 3. Ofertas totales
    const ofertasQuery = `
      SELECT 
        COUNT(*) as total_ofertas,
        COUNT(DISTINCT usuario_id) as total_usuarios,
        COUNT(CASE WHEN estado = 'ACTIVA' THEN 1 END) as ofertas_activas,
        COUNT(CASE WHEN estado = 'SUPERADA' THEN 1 END) as ofertas_superadas,
        COUNT(CASE WHEN estado = 'GANADORA' THEN 1 END) as ofertas_ganadoras
      FROM ofertas
    `;
    const ofertasResult = await db.query(ofertasQuery);
    const ofertasStats = ofertasResult.rows[0];

    // 4. Valor promedio de ofertas
    const promedioQuery = `
      SELECT AVG(monto) as promedio_oferta
      FROM ofertas
    `;
    const promedioResult = await db.query(promedioQuery);
    const promedioOferta = parseFloat(promedioResult.rows[0].promedio_oferta || 0);

    // 5. Tasa de conversión (obras con ofertas / total obras)
    const conversionQuery = `
      SELECT 
        COUNT(DISTINCT o.obra_id)::float / NULLIF(COUNT(DISTINCT ob.id), 0) * 100 as tasa_conversion
      FROM obras ob
      LEFT JOIN ofertas o ON ob.id = o.obra_id
    `;
    const conversionResult = await db.query(conversionQuery);
    const tasaConversion = parseFloat(conversionResult.rows[0].tasa_conversion || 0);

    res.status(200).json({
      success: true,
      data: {
        recaudado: {
          total: totalRecaudado,
          cambio: '+0%' // TODO: Calcular cambio vs período anterior
        },
        obras: {
          activas: parseInt(obrasStats.activas),
          vendidas: parseInt(obrasStats.vendidas),
          no_vendidas: parseInt(obrasStats.no_vendidas),
          pausadas: parseInt(obrasStats.pausadas),
          total: parseInt(obrasStats.total)
        },
        ofertas: {
          total: parseInt(ofertasStats.total_ofertas),
          activas: parseInt(ofertasStats.ofertas_activas),
          superadas: parseInt(ofertasStats.ofertas_superadas),
          ganadoras: parseInt(ofertasStats.ofertas_ganadoras),
          promedio: promedioOferta
        },
        usuarios: {
          total: parseInt(ofertasStats.total_usuarios),
          cambio: '+0%' // TODO: Calcular usuarios nuevos
        },
        conversion: {
          tasa: tasaConversion.toFixed(2),
          descripcion: `${tasaConversion.toFixed(1)}% de obras tienen ofertas`
        }
      }
    });
  } catch (error) {
    console.error('❌ Error en getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener top 5 obras con más ofertas
 * @route   GET /api/admin/analytics/top-obras
 * @access  Private/Admin
 */
const getTopObras = async (req, res) => {
  try {
    const query = `
      SELECT 
        ob.id,
        ob.nombre,
        ob.artista,
        ob.imagen_principal,
        ob.precio_base,
        ob.estado,
        COUNT(o.id) as numero_ofertas,
        COALESCE(MAX(o.monto), ob.precio_base) as precio_actual,
        COALESCE(MAX(o.monto), ob.precio_base) - ob.precio_base as incremento_total
      FROM obras ob
      LEFT JOIN ofertas o ON ob.id = o.obra_id
      GROUP BY ob.id, ob.nombre, ob.artista, ob.imagen_principal, ob.precio_base, ob.estado
      HAVING COUNT(o.id) > 0
      ORDER BY numero_ofertas DESC, precio_actual DESC
      LIMIT 5
    `;

    const result = await db.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error en getTopObras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener top obras',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener actividad de ofertas por hora (últimas 24h)
 * @route   GET /api/admin/analytics/actividad-ofertas
 * @access  Private/Admin
 */
const getActividadOfertas = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('hour', fecha_oferta) as hora,
        COUNT(*) as total_ofertas,
        SUM(monto) as volumen_total,
        COUNT(DISTINCT usuario_id) as usuarios_unicos
      FROM ofertas
      WHERE fecha_oferta >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', fecha_oferta)
      ORDER BY hora ASC
    `;

    const result = await db.query(query);

    // Formatear datos para gráficos
    const datos = result.rows.map(row => ({
      hora: new Date(row.hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      ofertas: parseInt(row.total_ofertas),
      volumen: parseFloat(row.volumen_total),
      usuarios: parseInt(row.usuarios_unicos)
    }));

    res.status(200).json({
      success: true,
      data: datos
    });
  } catch (error) {
    console.error('❌ Error en getActividadOfertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad de ofertas',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener top 10 postores más activos
 * @route   GET /api/admin/analytics/top-postores
 * @access  Private/Admin
 */
const getTopPostores = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        COUNT(o.id) as total_ofertas,
        COUNT(CASE WHEN o.estado = 'ACTIVA' THEN 1 END) as ofertas_activas,
        COUNT(CASE WHEN o.estado = 'GANADORA' THEN 1 END) as ofertas_ganadoras,
        SUM(o.monto) as volumen_total,
        MAX(o.fecha_oferta) as ultima_oferta
      FROM usuarios u
      INNER JOIN ofertas o ON u.id = o.usuario_id
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_ofertas DESC, volumen_total DESC
      LIMIT 10
    `;

    const result = await db.query(query);

    const datos = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      totalOfertas: parseInt(row.total_ofertas),
      ofertasActivas: parseInt(row.ofertas_activas),
      ofertasGanadoras: parseInt(row.ofertas_ganadoras),
      volumenTotal: parseFloat(row.volumen_total),
      ultimaOferta: row.ultima_oferta
    }));

    res.status(200).json({
      success: true,
      data: datos
    });
  } catch (error) {
    console.error('❌ Error en getTopPostores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener top postores',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener estadísticas en tiempo real (WebSocket compatible)
 * @route   GET /api/admin/analytics/live
 * @access  Private/Admin
 */
const getLiveStats = async (req, res) => {
  try {
    // Métricas lightweight para updates frecuentes
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM ofertas WHERE created_at >= NOW() - INTERVAL '1 hour') as ofertas_ultima_hora,
        (SELECT COUNT(*) FROM ofertas WHERE created_at >= NOW() - INTERVAL '5 minutes') as ofertas_ultimos_5min,
        (SELECT COUNT(DISTINCT obra_id) FROM ofertas WHERE created_at >= NOW() - INTERVAL '1 hour') as obras_con_actividad,
        (SELECT COUNT(*) FROM obras WHERE estado = 'ACTIVA' AND fecha_cierre <= NOW() + INTERVAL '1 hour') as obras_cerrando_pronto
    `;

    const result = await db.query(query);
    const stats = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        ofertasUltimaHora: parseInt(stats.ofertas_ultima_hora),
        ofertasUltimos5Min: parseInt(stats.ofertas_ultimos_5min),
        obrasConActividad: parseInt(stats.obras_con_actividad),
        obrasCerrandoPronto: parseInt(stats.obras_cerrando_pronto),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error en getLiveStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas en vivo',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener distribución de ofertas por rango de precio
 * @route   GET /api/admin/analytics/distribucion-precios
 * @access  Private/Admin
 */
const getDistribucionPrecios = async (req, res) => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN monto < 100 THEN '0-100'
          WHEN monto < 500 THEN '100-500'
          WHEN monto < 1000 THEN '500-1000'
          WHEN monto < 5000 THEN '1000-5000'
          ELSE '5000+'
        END as rango,
        COUNT(*) as cantidad
      FROM ofertas
      GROUP BY rango
      ORDER BY 
        CASE 
          WHEN rango = '0-100' THEN 1
          WHEN rango = '100-500' THEN 2
          WHEN rango = '500-1000' THEN 3
          WHEN rango = '1000-5000' THEN 4
          ELSE 5
        END
    `;

    const result = await db.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error en getDistribucionPrecios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener distribución de precios',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getTopObras,
  getActividadOfertas,
  getTopPostores,
  getLiveStats,
  getDistribucionPrecios
};
