# ✅ CHECKPOINT 4 COMPLETADO - Sistema de Ofertas en Tiempo Real

**Fecha:** 2026-02-21  
**Estado:** Backend implementado  
**Próximo paso:** Frontend con interfaz de ofertas en tiempo real

---

## 📋 Resumen

Se ha implementado el sistema completo de ofertas en tiempo real con WebSocket, control de concurrencia, validaciones de negocio y extensión dinámica de tiempo.

---

## 🎯 Funcionalidades Implementadas

### 1. **Controller de Ofertas** (`ofertaController.js`)

#### Endpoints Implementados:

**Crear Oferta**
- `POST /api/ofertas`
- Validaciones:
  - Monto mayor al precio actual + incremento mínimo
  - Usuario no puede ofertar sobre su propia oferta
  - Subasta debe estar activa y no cerrada
  - Verificación de compra inmediata
- Control de concurrencia con `FOR UPDATE`
- Extensión automática de tiempo (último minuto → +2 min)
- Broadcast a todos los clientes conectados
- Notificación al postor superado

**Listar Ofertas**
- `GET /api/ofertas/obra/:obraId` - Ofertas de una obra
- `GET /api/ofertas/obra/:obraId/ganadora` - Oferta ganadora actual
- `GET /api/ofertas/mis-ofertas` - Historial del usuario
- `GET /api/ofertas/mis-estadisticas` - Estadísticas del usuario

**Administración**
- `GET /api/admin/ofertas` - Todas las ofertas con filtros
- `DELETE /api/admin/ofertas/:id` - Cancelar oferta (excepcional)

---

### 2. **Servicio de WebSocket** (`websocketService.js`)

#### Características:

**Autenticación**
- Token JWT desde cookies o headers
- Asociación de sockets con usuarios
- Rooms personales por usuario (`user:{id}`)

**Rooms por Obra**
- Evento: `join_obra` - Usuario se une a sala de obra
- Evento: `leave_obra` - Usuario sale de sala
- Estado inicial enviado al unirse

**Eventos Emitidos:**
- `nueva_oferta` - Broadcast cuando hay nueva oferta
- `superado` - Notificación personal de postor superado
- `subasta_cerrada` - Notifica cierre de subasta
- `ganaste` - Notifica al ganador
- `extension_tiempo` - Notifica extensión de tiempo
- `advertencia_cierre` - Aviso cuando quedan 30 segundos

**Auction Monitor**
- Se ejecuta cada 10 segundos
- Detecta subastas que cierran en 30 segundos
- Cierra automáticamente subastas vencidas
- Marca ganadores y perdedores
- Actualiza estado de obras

**Funciones Utilitarias:**
- `getObraEstado()` - Obtiene estado completo de obra
- `getConnectedUsers()` - Cuenta usuarios en una obra
- `getTotalConnected()` - Total de clientes conectados

---

### 3. **Lógica de Negocio**

#### Validaciones de Oferta:

```javascript
1. Obra existe y está activa
2. Subasta no ha cerrado
3. Monto >= precio_actual + incremento_minimo
4. Usuario no tiene la última oferta
5. Compra inmediata: monto >= precio_comprar_ahora
```

#### Extensión Dinámica de Tiempo:

```javascript
if (tiempoRestante <= 60 segundos) {
  nuevaFechaCierre = fechaCierre + 2 minutos;
  UPDATE obras SET fecha_cierre = nuevaFechaCierre;
  broadcast 'extension_tiempo' event;
}
```

#### Estados de Oferta:

- `ACTIVA` - Oferta ganadora actual
- `SUPERADA` - Fue superada por otra oferta
- `GANADORA` - Ganó la subasta (compra inmediata o cierre)
- `PERDIDA` - Perdió la subasta o fue cancelada

#### Control de Concurrencia:

```sql
-- Bloqueo de fila para evitar race conditions
SELECT * FROM obras WHERE id = $1 FOR UPDATE;

-- Transacciones ACID
BEGIN;
  -- Validaciones
  -- Actualizar obra
  -- Marcar ofertas anteriores como SUPERADAS
  -- Crear nueva oferta
COMMIT;
```

---

### 4. **Integración con Express**

**Modificaciones en `server.js`:**

```javascript
// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: { origin: config.cors.origin, credentials: true },
  transports: ['websocket', 'polling']
});

// Inicializar WebSocket
initializeWebSocket(io);

// Cambiar app.listen → server.listen
server.listen(PORT, ...);
```

**Nuevas Rutas:**

```
/api/ofertas           → Rutas públicas/autenticadas
/api/admin/ofertas     → Rutas administrativas
ws://localhost:4000    → WebSocket endpoint
```

---

## 🔧 Estructura de Datos

### Tabla `ofertas`:

```sql
CREATE TABLE ofertas (
  id                UUID PRIMARY KEY,
  obra_id           UUID REFERENCES obras(id),
  usuario_id        UUID REFERENCES usuarios(id),
  monto             DECIMAL(10,2) NOT NULL,
  precio_anterior   DECIMAL(10,2),
  es_compra_inmediata BOOLEAN DEFAULT FALSE,
  estado            VARCHAR(20) DEFAULT 'ACTIVA',
  ip_address        VARCHAR(50),
  user_agent        TEXT,
  fecha_oferta      TIMESTAMP DEFAULT NOW(),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ofertas_obra ON ofertas(obra_id);
CREATE INDEX idx_ofertas_usuario ON ofertas(usuario_id);
CREATE INDEX idx_ofertas_fecha ON ofertas(fecha_oferta DESC);
CREATE INDEX idx_ofertas_estado ON ofertas(estado);
```

---

## 📡 Flujo de Comunicación WebSocket

### Cliente se Conecta:

```javascript
// 1. Cliente conecta con token
socket.on('connection', (socket) => {
  // Autenticar con JWT
  // Agregar a Map de usuarios
  // Unir a room personal
});

// 2. Cliente se une a sala de obra
socket.emit('join_obra', obraId);

// 3. Servidor envía estado inicial
socket.emit('obra_estado', {
  obra: {...},
  precio_actual: 1500,
  numero_ofertas: 5,
  tiempo_restante_segundos: 3600,
  ultima_oferta: {...}
});
```

### Usuario Hace Oferta:

```javascript
// 1. POST /api/ofertas (HTTP)
const response = await fetch('/api/ofertas', {
  method: 'POST',
  body: JSON.stringify({ obra_id, monto })
});

// 2. Backend valida y crea oferta (transacción)

// 3. Broadcast por WebSocket a `obra:{id}`
io.to(`obra:${obra_id}`).emit('nueva_oferta', {
  oferta: {...},
  precio_actual: 1600,
  numero_ofertas: 6,
  tiempo_extendido: true
});

// 4. Notificar al postor anterior
io.to(`user:${old_user_id}`).emit('superado', {
  obra_id,
  nuevo_precio: 1600
});
```

### Monitor Cierra Subasta:

```javascript
// Cada 10 segundos
setInterval(async () => {
  // 1. Buscar subastas vencidas
  const vencidas = await query('SELECT ... WHERE fecha_cierre <= NOW()');
  
  // 2. Para cada subasta
  for (const obra of vencidas) {
    // Actualizar estado
    UPDATE obras SET estado = 'VENDIDA';
    UPDATE ofertas SET estado = 'GANADORA' WHERE ...;
    
    // 3. Broadcast cierre
    io.to(`obra:${obra_id}`).emit('subasta_cerrada', {
      ganador: {...}
    });
    
    // 4. Notificar ganador
    io.to(`user:${ganador_id}`).emit('ganaste', {...});
  }
}, 10000);
```

---

## 🧪 Testing

### Test de Oferta Simple:

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@subasta.com","password":"admin123"}' | jq -r '.data.token')

# 2. Crear oferta
curl -X POST http://localhost:4000/api/ofertas \
  -H "Cookie: auth_token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "obra_id": "uuid-de-obra",
    "monto": 1500
  }' | jq

# 3. Ver ofertas de una obra
curl http://localhost:4000/api/ofertas/obra/{obraId} | jq

# 4. Ver mis ofertas
curl http://localhost:4000/api/ofertas/mis-ofertas \
  -H "Cookie: auth_token=$TOKEN" | jq
```

### Test de WebSocket (Node.js):

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:4000', {
  auth: { token: 'jwt-token' }
});

socket.on('connect', () => {
  console.log('Conectado');
  socket.emit('join_obra', 'obra-uuid');
});

socket.on('obra_estado', (data) => {
  console.log('Estado inicial:', data);
});

socket.on('nueva_oferta', (data) => {
  console.log('Nueva oferta:', data);
});

socket.on('superado', (data) => {
  console.log('Fuiste superado:', data);
});
```

---

## 📊 Performance y Escalabilidad

### Control de Concurrencia:
- ✅ Transacciones ACID con PostgreSQL
- ✅ `FOR UPDATE` para bloqueo de filas
- ✅ Validaciones dentro de transacción

### WebSocket Optimizations:
- ✅ Rooms por obra (broadcast selectivo)
- ✅ Rooms por usuario (notificaciones personales)
- ✅ Transports: websocket + polling (fallback)

### Índices de Base de Datos:
- ✅ Índice en `obra_id` para ofertas
- ✅ Índice en `fecha_oferta DESC` para ordenamiento
- ✅ Índice en `estado` para filtros

### Futuras Mejoras:
- [ ] Redis para pub/sub entre servidores (horizontal scaling)
- [ ] Rate limiting por usuario en ofertas
- [ ] Cache de estado de obra en Redis
- [ ] Compression para eventos WebSocket
- [ ] Reconnection estrategias en cliente

---

## 🎨 Próximos Pasos (Frontend)

### Componentes a Crear:

1. **ObrasGrid.tsx** - Grid de obras activas
2. **ObraDetail.tsx** - Página de detalle con ofertas
3. **OfertaForm.tsx** - Formulario para ofertar
4. **OfertasLive.tsx** - Lista de ofertas en tiempo real
5. **Countdown.tsx** - Contador regresivo animado
6. **useWebSocket.ts** - Hook para WebSocket
7. **useBidding.ts** - Hook para lógica de ofertas

### Funcionalidades Frontend:

- 🎯 Conexión automática a WebSocket
- 🔄 Reconexión automática si se cae
- ⏰ Countdown con animación
- 🔔 Notificaciones toast cuando te superan
- 💰 Formulario validado de oferta
- 📊 Historial de ofertas en tiempo real
- 🏆 Badge de "Ganando" si eres el postor líder
- ⚡ Botón de compra inmediata

---

## 📝 Notas Técnicas

### Diagrama de Flujo de Oferta:

```
Cliente                Backend              PostgreSQL          WebSocket
  |                      |                      |                   |
  |-- POST /ofertas ---->|                      |                   |
  |                      |--- BEGIN ----------->|                   |
  |                      |--- SELECT FOR UPDATE |                   |
  |                      |<-- obra data ---------|                   |
  |                      |--- validaciones ---->|                   |
  |                      |--- INSERT oferta ---->|                   |
  |                      |<-- oferta_id ---------|                   |
  |                      |--- COMMIT ----------->|                   |
  |<-- 201 Created ------|                      |                   |
  |                      |--- broadcast ---------------------->|     |
  |                      |                      |              |     |
Otros Clientes          |                      |              v     |
  |<-----------------------------------------------------------------|
  |    { nueva_oferta: ... }                                         |
```

### Consideraciones de Seguridad:

1. ✅ JWT validation en WebSocket
2. ✅ Rate limiting (TODO: implementar)
3. ✅ SQL injection prevención (parametrized queries)
4. ✅ No exponer emails completos en broadcasts
5. ✅ Validar ownership antes de cancelar oferta

---

## 🚀 Estado del Proyecto

| Componente | Estado | Progreso |
|------------|--------|----------|
| Tabla de ofertas | ✅ Completo | 100% |
| Controller de ofertas | ✅ Completo | 100% |
| Validaciones de negocio | ✅ Completo | 100% |
| WebSocket service | ✅ Completo | 100% |
| Auction monitor | ✅ Completo | 100% |
| Extensión de tiempo | ✅ Completo | 100% |
| Control de concurrencia | ✅ Completo | 100% |
| Rutas HTTP | ✅ Completo | 100% |
| Integración Socket.io | ✅ Completo | 100% |
| Testing backend | ⏳ Pendiente | 0% |
| Frontend ofertas | ⏳ Pendiente | 0% |
| WebSocket client | ⏳ Pendiente | 0% |
| Componentes UI | ⏳ Pendiente | 0% |

---

## 📚 Referencias

- Socket.io Docs: https://socket.io/docs/v4/
- PostgreSQL Transactions: https://www.postgresql.org/docs/current/tutorial-transactions.html
- Auction Extension Patterns: https://en.wikipedia.org/wiki/Auction_sniping

---

**Backend del Checkpoint 4 completado exitosamente! 🎉**

**Siguiente:** Implementar frontend con interfaz de ofertas en tiempo real
