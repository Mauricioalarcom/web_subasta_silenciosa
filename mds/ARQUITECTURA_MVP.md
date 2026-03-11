# ARQUITECTURA MVP - PLATAFORMA DE SUBASTA SILENCIOSA

## 1. RESUMEN DEL SISTEMA

Sistema de subasta silenciosa compuesto por dos aplicaciones web independientes:

- **Web Pública (Postores)**: Plataforma donde usuarios registrados pueden visualizar obras y realizar ofertas en tiempo real.
- **Web Administrativa**: Panel privado para gestión de eventos, obras, ofertas y pagos.

**Características principales:**
- Subastas independientes por obra
- Cierre dinámico con extensión automática (10 minutos)
- Sistema de ofertas con incremento mínimo obligatorio
- Opción "Cómpralo ahora" con cierre inmediato
- Múltiples métodos de pago
- Notificaciones automáticas por email
- Dashboard en tiempo real para administradores

---

## 2. ARQUITECTURA PROPUESTA

### 2.1 Stack Tecnológico Recomendado

**Frontend:**
- React/Next.js para Web Pública
- React/Next.js para Panel Administrativo
- TailwindCSS para estilos
- Socket.io-client para actualizaciones en tiempo real
- React Query para gestión de estado

**Backend:**
- Node.js con Express o NestJS
- PostgreSQL como base de datos principal
- Redis para caché y gestión de sesiones
- Socket.io para WebSockets
- Bull/BullMQ para manejo de jobs (notificaciones, cierre automático)

**Servicios Externos:**
- OAuth 2.0 (Google) para autenticación
- Servicio de email (SendGrid, AWS SES, Resend)
- Pasarela de pagos (Stripe, Culqi, Mercado Pago)
- Almacenamiento de archivos (AWS S3, Cloudinary)

**Infraestructura:**
- Hosting para ambas aplicaciones (Vercel, Railway, Render)
- Base de datos gestionada (Railway, Supabase, AWS RDS)
- CDN para imágenes

### 2.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                 │
├─────────────────────┬───────────────────────────────────────────┤
│    Postores         │         Administradores                    │
└──────────┬──────────┴──────────────┬────────────────────────────┘
           │                         │
           │                         │
    ┌──────▼──────┐          ┌──────▼──────┐
    │  WEB 1      │          │  WEB 2      │
    │  (Pública)  │          │  (Admin)    │
    └──────┬──────┘          └──────┬──────┘
           │                         │
           └─────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   API REST  │
              │  + WebSocket│
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐  ┌────▼────┐  ┌────▼────┐
   │PostgreSQL│ │  Redis   │ │ Bull Queue│
   └─────────┘  └─────────┘  └────┬────┘
                                   │
                        ┌──────────┼──────────┐
                        │          │          │
                   ┌────▼───┐ ┌───▼────┐ ┌───▼────┐
                   │ Email  │ │ Payment│ │ Storage│
                   │ Service│ │Gateway │ │ Service│
                   └────────┘ └────────┘ └────────┘
```

### 2.3 Componentes del Sistema

**API Backend:**
- Autenticación y autorización
- Gestión de usuarios
- Gestión de eventos
- Gestión de obras
- Sistema de ofertas (con control de concurrencia)
- Sistema de pagos
- Sistema de notificaciones
- WebSocket server para actualizaciones en tiempo real

**Workers/Jobs:**
- Monitor de cierre de subastas
- Procesador de extensiones dinámicas
- Enviador de notificaciones
- Procesador de pagos
- Limpieza de datos

---

## 3. SEPARACIÓN ESTRICTA DE LAS DOS APLICACIONES WEB

### 3.1 Web 1 - Plataforma Pública (Postores)

**Dominio sugerido:** `app.subasta.com` o `bid.subasta.com`

**Características:**
- Acceso público (registro requerido para ofertar)
- Diseño responsive y atractivo
- Enfoque en experiencia de usuario
- Actualizaciones en tiempo real
- Sin acceso a funciones administrativas

**Rutas:**
```
/                          → Landing page del evento
/auth/login               → Inicio de sesión
/auth/register            → Registro (OAuth Google)
/galeria                  → Listado de todas las obras
/obra/:id                 → Detalle de obra individual
/mis-ofertas              → Historial de ofertas del usuario
/perfil                   → Perfil del usuario
/pago/:obraId             → Página de pago (solo ganador)
```

**Restricciones:**
- No puede acceder a `/admin/*`
- No puede ver información de otros usuarios
- No puede modificar obras ni configuración
- Solo ve obras del evento activo

### 3.2 Web 2 - Panel de Administración

**Dominio sugerido:** `admin.subasta.com`

**Características:**
- Acceso restringido (solo usuarios con rol ADMIN)
- Diseño funcional y claro
- Dashboard con métricas en tiempo real
- Gestión completa del sistema
- Sin exposición pública

**Rutas:**
```
/admin/login              → Login administrativo
/admin/dashboard          → Dashboard principal
/admin/evento             → Configuración del evento
/admin/obras              → Listado de obras
/admin/obras/crear        → Crear nueva obra
/admin/obras/:id/editar   → Editar obra
/admin/ofertas            → Historial de todas las ofertas
/admin/pagos              → Gestión de pagos y entregas
/admin/usuarios           → Listado de usuarios registrados
/admin/reportes           → Exportación de datos
```

**Restricciones:**
- No hereda estilos ni componentes de Web 1
- Autenticación separada con mayor seguridad
- No accesible desde Web 1
- Requiere permisos específicos

### 3.3 Separación en el Backend

**Middlewares de Autorización:**

```
authMiddleware          → Valida token JWT
roleMiddleware(ADMIN)   → Valida rol de administrador
```

**Endpoints separados:**

```
Rutas públicas:
POST   /api/auth/google           → Login con Google
GET    /api/evento                → Info del evento
GET    /api/obras                 → Listado de obras
GET    /api/obras/:id             → Detalle de obra

Rutas de usuario autenticado:
POST   /api/ofertas               → Realizar oferta
GET    /api/ofertas/mis-ofertas   → Historial propio
POST   /api/pagos/procesar        → Procesar pago
POST   /api/pagos/voucher         → Subir voucher

Rutas administrativas:
POST   /api/admin/evento          → Configurar evento
POST   /api/admin/obras           → Crear obra
PUT    /api/admin/obras/:id       → Editar obra
DELETE /api/admin/obras/:id       → Eliminar obra
GET    /api/admin/dashboard       → Métricas en tiempo real
PUT    /api/admin/pagos/:id       → Actualizar estado de pago
GET    /api/admin/reportes/csv    → Exportar datos
```

---

## 4. FUNCIONALIDADES COMPLETAS DE CADA APLICACIÓN

### 4.1 WEB 1 - PLATAFORMA PÚBLICA (POSTORES)

#### 4.1.1 Sistema de Autenticación

**Registro:**
- Login exclusivo con Google OAuth 2.0
- Al primer login, solicitar datos adicionales:
  - Nombre completo
  - Teléfono
  - Confirmación de términos y condiciones
- Crear cuenta automáticamente
- Asignar rol USER por defecto

**Login:**
- Botón "Continuar con Google"
- Redirección a callback OAuth
- Generación de JWT
- Redirección a página principal

**Persistencia:**
- Token JWT almacenado en httpOnly cookie
- Refresh token para renovación automática
- Sesión válida por 7 días

#### 4.1.2 Página Principal (Landing)

**Elementos visuales:**
- Nombre del evento (título principal)
- Logo de la organización
- Banner/hero image
- Descripción del evento
- Información de la organización

**Información temporal:**
- Fecha y hora de inicio (formato: DD/MM/YYYY HH:mm)
- Fecha y hora de cierre programado (formato: DD/MM/YYYY HH:mm)
- Contador regresivo en tiempo real mostrando:
  - Días
  - Horas
  - Minutos
  - Segundos

**Estados del contador:**
```
Antes del inicio:  "La subasta comienza en X días X horas"
Durante subasta:   "La subasta finaliza en X horas X minutos"
Después de cierre: "Subasta finalizada"
```

**Acciones:**
- Botón destacado: "Ver Galería de Obras"
- Botón secundario: "Cómo Funciona" (modal explicativo)

#### 4.1.3 Galería de Obras

**Vista de Grid:**
- Layout responsive (grid de 2-4 columnas según dispositivo)
- Cada tarjeta muestra:
  - Imagen principal de la obra (ratio 4:3 o 1:1)
  - Nombre de la obra
  - Nombre del artista
  - Precio actual (actualizado en tiempo real)
  - Badge de estado:
    - "Activa" (verde)
    - "Extendida" (amarillo)
    - "Cerrada" (gris)
    - "Vendida" (azul)
  - Botón "Ver Detalle"

**Filtros:**
- Por estado (Todas / Activas / Cerradas)
- Por rango de precio
- Búsqueda por nombre de obra o artista

**Ordenamiento:**
- Por precio (ascendente/descendente)
- Por fecha de cierre
- Por número de ofertas

**Actualización en tiempo real:**
- Precio actual se actualiza vía WebSocket
- Badge de estado cambia automáticamente
- Notificación visual cuando hay nueva oferta

#### 4.1.4 Detalle de Obra

**Información visual:**
- Imagen grande de la obra (lightbox habilitado)
- Galería secundaria si hay múltiples imágenes

**Información de la obra:**
- Nombre de la obra (título principal)
- Nombre del artista
- Descripción completa (markdown formatting)
- Técnica (óleo, acrílico, etc.)
- Dimensiones
- Año de creación

**Información de subasta:**
- Precio base: $X,XXX
- Incremento mínimo: $XXX
- Precio actual: $X,XXX (actualizado en tiempo real)
- Número de ofertas realizadas
- Tiempo restante (contador regresivo individual)

**Sección de Oferta:**
- Input para monto de oferta
- Validación visual:
  - Si el monto es válido: borde verde
  - Si el monto es inválido: borde rojo + mensaje de error
- Botón "Realizar Oferta"
  - Deshabilitado si:
    - Usuario no autenticado → mostrar "Inicia sesión para ofertar"
    - Subasta no comenzó → mostrar "La subasta aún no ha comenzado"
    - Subasta ya cerró → mostrar "Esta subasta ha finalizado"
    - Usuario es el mejor postor → mostrar "Ya tienes la mejor oferta"
    - Monto inválido → mostrar mensaje específico

**Opción "Cómpralo Ahora":**
- Solo visible si el administrador configuró un precio de compra inmediata
- Botón destacado: "Cómpralo Ahora por $X,XXX"
- Al hacer clic:
  - Confirmar acción (modal)
  - Cierra inmediatamente la subasta para esa obra
  - Usuario se convierte en ganador automático
  - Redirecciona a página de pago

**Historial de Ofertas:**
- Tabla con últimas 10 ofertas:
  - Fecha y hora
  - Monto
  - Usuario (anónimo: "Usuario #1234")
  - Badge "Tu oferta" si es del usuario actual
- Solo muestra monto, no datos personales

**Notificaciones en esta vista:**
- Toast cuando alguien supera tu oferta
- Toast cuando realizas una oferta exitosa
- Toast cuando la subasta se extiende

#### 4.1.5 Sistema de Ofertas

**Validaciones Frontend:**
- Usuario autenticado
- Subasta activa (dentro del período de tiempo)
- Monto >= precio base (si es primera oferta)
- Monto >= precio actual + incremento mínimo (si hay ofertas previas)
- Usuario no es el mejor postor actual

**Flujo de Oferta:**
1. Usuario ingresa monto
2. Click en "Realizar Oferta"
3. Validación frontend
4. Loading state en botón
5. Request a API
6. Validación backend (con lock de concurrencia)
7. Si exitosa:
   - Actualizar precio actual en UI
   - Mostrar toast de confirmación
   - Actualizar historial de ofertas
   - WebSocket notifica a otros usuarios
8. Si falla:
   - Mostrar error específico
   - No actualizar UI

**Mensajes de Error:**
- "El monto debe ser al menos $X,XXX"
- "Ya tienes la mejor oferta para esta obra"
- "Esta oferta fue superada. El precio actual es $X,XXX"
- "La subasta ha finalizado"
- "Error de conexión. Intenta nuevamente"

#### 4.1.6 Mis Ofertas (Historial del Usuario)

**Vista de Lista:**
- Tabla con todas las ofertas del usuario:
  - Imagen miniatura de la obra
  - Nombre de la obra
  - Tu oferta
  - Precio actual
  - Estado:
    - "Ganando" (verde) - eres el mejor postor
    - "Superada" (rojo) - alguien ofreció más
    - "Ganada" (azul) - ganaste la subasta
    - "Perdida" (gris) - perdiste la subasta
  - Acción:
    - "Ver obra" - link al detalle
    - "Pagar" - si ganaste y aún no pagas

**Filtros:**
- Todas / Ganando / Superadas / Finalizadas

**Estadísticas personales:**
- Total de ofertas realizadas
- Obras ganando actualmente
- Obras ganadas

#### 4.1.7 Sistema de Notificaciones

**Tipos de Notificaciones (Email):**

1. **Confirmación de Oferta:**
   - Destinatario: Usuario que realizó la oferta
   - Trigger: Al realizar oferta exitosa
   - Contenido:
     - Nombre de la obra
     - Monto de la oferta
     - Precio actual
     - Link a la obra

2. **Oferta Superada:**
   - Destinatario: Usuario cuya oferta fue superada
   - Trigger: Cuando alguien más ofrece más
   - Contenido:
     - Nombre de la obra
     - Tu oferta anterior
     - Nueva oferta actual
     - Incremento necesario para recuperar posición
     - Link a la obra
     - CTA: "Realizar nueva oferta"

3. **Ganaste la Subasta:**
   - Destinatario: Ganador
   - Trigger: Al cerrar la subasta (sin nuevas ofertas en 10 min)
   - Contenido:
     - Nombre de la obra
     - Monto ganador
     - Felicitación
     - Instrucciones de pago
     - Link a página de pago
     - Fecha límite de pago

4. **Recordatorio de Pago:**
   - Destinatario: Ganador que no ha pagado
   - Trigger: 24 horas después de ganar
   - Contenido:
     - Recordatorio de pago pendiente
     - Link a página de pago

5. **Confirmación de Pago Recibido:**
   - Destinatario: Ganador
   - Trigger: Después de confirmar pago
   - Contenido:
     - Confirmación de pago
     - Instrucciones de entrega

**Notificaciones In-App (Toast/Banner):**
- Nueva oferta en obra que estás viendo
- Fuiste superado
- Oferta exitosa
- Extensión de tiempo
- Subasta cerrada

#### 4.1.8 Cierre Dinámico de Subasta

**Lógica de Extensión:**
- Cada obra tiene su propia `fecha_cierre`
- Sistema monitorea ofertas en tiempo real
- Si se recibe oferta dentro de los últimos 10 minutos antes del cierre:
  - `fecha_cierre` se extiende +10 minutos desde el momento de la oferta
  - Se notifica a todos los usuarios vía WebSocket
  - Contador regresivo se actualiza
  - Badge cambia a "Extendida"
- El proceso se repite indefinidamente
- La subasta cierra cuando pasan 10 minutos sin nuevas ofertas

**Ejemplo:**
```
Cierre programado: 20:00:00
19:52:00 → Nueva oferta
Nuevo cierre: 20:02:00 (10 min desde la oferta)

19:58:00 → Otra oferta
Nuevo cierre: 20:08:00

20:07:30 → Otra oferta
Nuevo cierre: 20:17:30

... Sin ofertas ...

20:17:30 → CIERRE DEFINITIVO
```

**Implementación Técnica:**
- Job scheduler revisa cada minuto obras próximas a cerrar
- Al detectar cierre sin ofertas recientes:
  - Cambiar estado de obra a "CERRADA"
  - Identificar ganador (última mejor oferta)
  - Enviar notificación a ganador
  - Enviar notificación a administradores
  - Actualizar dashboard
  - WebSocket notifica cierre a todos los clientes

#### 4.1.9 Sistema de Pago

**Acceso:**
- Solo para ganadores
- Link directo enviado por email
- Validación de usuario y obra

**Página de Pago:**

**Resumen de Compra:**
- Imagen de la obra
- Nombre de la obra
- Artista
- Monto a pagar
- Fecha límite de pago

**Métodos de Pago:**

1. **Tarjeta de Crédito/Débito:**
   - Integración con pasarela (Stripe, Culqi, etc.)
   - Formulario PCI-compliant
   - Campos:
     - Número de tarjeta
     - Fecha de expiración
     - CVV
     - Nombre en tarjeta
   - Botón "Pagar $X,XXX"
   - Procesamiento inmediato
   - Confirmación automática

2. **Transferencia Bancaria:**
   - Mostrar datos bancarios:
     - Banco
     - Número de cuenta
     - CCI
     - Titular
     - Monto exacto
   - Campo para subir voucher/comprobante:
     - Formatos aceptados: JPG, PNG, PDF
     - Máximo 5MB
   - Botón "Enviar Comprobante"
   - Estado: "Pendiente de Verificación"
   - Administrador debe confirmar manualmente

3. **Pago por QR (Yape, Plin, etc.):**
   - Mostrar QR code generado
   - Monto preconfigurado
   - Instrucciones:
     - Escanear QR con app
     - Confirmar pago
     - Subir captura de confirmación
   - Campo para subir captura
   - Estado: "Pendiente de Verificación"

**Estados de Pago:**
- PENDIENTE (asignado pero sin pago)
- PROCESANDO (pago enviado, esperando confirmación)
- CONFIRMADO (pago verificado)
- RECHAZADO (pago inválido)

**Confirmación:**
- Después de pago exitoso:
  - Mensaje de éxito
  - Información de entrega
  - Email de confirmación
  - Cambio de estado en base de datos

---

### 4.2 WEB 2 - PANEL DE ADMINISTRACIÓN

#### 4.2.1 Autenticación Administrativa

**Acceso:**
- Email + contraseña (admin específico)
- O Google OAuth con whitelist de emails
- Solo usuarios con rol ADMIN pueden acceder
- Sesión con timeout de 4 horas

**Seguridad:**
- Autenticación multifactor (opcional pero recomendado)
- Logs de acceso
- IP whitelisting (opcional)

#### 4.2.2 Dashboard Principal

**Métricas en Tiempo Real:**

**Sección: Resumen General**
- Total recaudado (suma de pagos confirmados): $XX,XXX
- Total potencial (suma de precios actuales): $XX,XXX
- Obras activas: X
- Obras cerradas: X
- Obras vendidas: X
- Obras sin vender: X
- Total de participantes: X
- Total de ofertas: X

**Sección: Estado de Obras** (Tabla)
Columnas:
- Imagen (thumbnail)
- Nombre de obra
- Artista
- Precio base
- Precio actual
- Mejor postor (nombre + email)
- Número de ofertas
- Estado:
  - "Activa" (verde)
  - "Extendida" (amarillo) - con número de extensiones
  - "Cerrada" (gris)
  - "Vendida" (azul) - pago confirmado
  - "No Vendida" (rojo) - sin ofertas
- Tiempo restante / Fecha de cierre
- Acciones:
  - Ver detalle
  - Ver ofertas
  - Editar

**Actualización:**
- Datos se actualizan cada 5 segundos vía polling o WebSocket
- Indicador visual de última actualización

**Gráficos:**
- Evolución de ofertas por hora (gráfico de líneas)
- Obras por estado (gráfico de dona)
- Top 5 obras por número de ofertas
- Top 5 obras por monto actual

#### 4.2.3 Configuración del Evento

**Formulario de Edición:**

**Información Básica:**
- Nombre del evento* (texto, máx 100 caracteres)
- Organización* (texto, máx 100 caracteres)
- Descripción (textarea, markdown support, máx 1000 caracteres)

**Imágenes:**
- Logo de organización:
  - Upload con preview
  - Formato: PNG/JPG
  - Dimensiones recomendadas: 400x400px
  - Máx 2MB
- Imagen de banner/hero:
  - Upload con preview
  - Formato: PNG/JPG
  - Dimensiones recomendadas: 1920x600px
  - Máx 5MB
- Galería de imágenes (hasta 5):
  - Multiple upload
  - Preview de cada una
  - Orden configurable (drag & drop)

**Fechas y Horarios:**
- Fecha y hora de inicio*:
  - Date picker con time picker
  - Validación: debe ser futuro o presente
- Fecha y hora de cierre programado*:
  - Date picker con time picker
  - Validación: debe ser posterior a inicio
  - Nota: "Las obras pueden extenderse automáticamente"

**Configuración Adicional:**
- Email de contacto
- Teléfono de contacto
- Mensaje de bienvenida
- Términos y condiciones (textarea)

**Acciones:**
- Guardar cambios
- Vista previa (abre Web 1 en nueva pestaña)

**Validaciones:**
- No se puede cambiar fecha de inicio si ya comenzó
- No se puede cambiar fecha de cierre si ya estamos en período de cierre

#### 4.2.4 Gestión de Obras

**Listado de Obras:**

**Vista de Tabla:**
Columnas:
- Imagen (thumbnail)
- Nombre
- Artista
- Precio base
- Precio actual
- Incremento mínimo
- Cómpralo ahora
- Estado
- Ofertas
- Fecha de cierre
- Acciones:
  - Editar
  - Eliminar (solo si no tiene ofertas)
  - Duplicar
  - Ver en web pública

**Filtros:**
- Por estado
- Por rango de precio
- Búsqueda por nombre/artista

**Botón de Acción Principal:**
- "Crear Nueva Obra"

**Crear/Editar Obra:**

**Formulario:**

**Información de la Obra:**
- Nombre de la obra* (texto, máx 150 caracteres)
- Nombre del artista* (texto, máx 100 caracteres)
- Descripción* (textarea, markdown support, máx 2000 caracteres)
- Técnica (óleo, acrílico, escultura, fotografía, etc.)
- Dimensiones (ancho x alto x profundidad en cm)
- Año de creación
- Información adicional (textarea)

**Imágenes:**
- Imagen principal*:
  - Upload con preview
  - Formato: PNG/JPG
  - Dimensiones recomendadas: 1200x1200px
  - Máx 5MB
- Galería adicional (hasta 5 imágenes):
  - Multiple upload
  - Preview
  - Orden configurable

**Configuración de Subasta:**
- Precio base*:
  - Input numérico
  - Mínimo: $1
  - Formato: $X,XXX.XX
- Incremento mínimo*:
  - Input numérico
  - Mínimo: $1
  - Formato: $XXX.XX
  - Recomendación: 5-10% del precio base
- Precio "Cómpralo Ahora" (opcional):
  - Input numérico
  - Validación: debe ser mayor a precio base
  - Si se define, se habilita opción en web pública
  - Checkbox: "Habilitar compra inmediata"

**Configuración de Cierre:**
- Usar fecha de cierre del evento (checkbox, por defecto activo)
- O definir fecha de cierre personalizada:
  - Date picker con time picker
  - Validación: debe ser posterior a inicio de evento

**Estado:**
- Borrador (no visible en web pública)
- Publicada (visible y activa)
- Oculta (no visible temporalmente)
- Cerrada (manualmente cerrada)

**Acciones:**
- Guardar como borrador
- Publicar
- Vista previa

**Validaciones:**
- Precio base > 0
- Incremento mínimo > 0
- Precio "Cómpralo ahora" > precio base (si está definido)
- Al menos una imagen
- No se puede reducir precio base si ya hay ofertas
- No se puede eliminar obra con ofertas

#### 4.2.5 Gestión de Ofertas

**Vista General de Ofertas:**

**Tabla con Todas las Ofertas:**
Columnas:
- Fecha y hora
- Obra (nombre + thumbnail)
- Usuario (nombre + email)
- Monto
- Estado:
  - "Activa" (es la mejor oferta actual)
  - "Superada" (fue superada)
  - "Ganadora" (ganó la subasta)
- Acciones:
  - Ver usuario
  - Ver obra

**Filtros:**
- Por obra
- Por usuario
- Por rango de fecha
- Por estado
- Por rango de monto

**Exportación:**
- Botón "Exportar CSV"
- Incluye todas las columnas

**Detalle de Ofertas por Obra:**
- Acceso desde listado de obras
- Historial completo de ofertas
- Gráfico de evolución de precio
- Timeline de ofertas

#### 4.2.6 Gestión de Pagos y Entregas

**Tabla de Pagos:**

**Columnas:**
- Obra (nombre + imagen)
- Ganador:
  - Nombre
  - Email
  - Teléfono
- Monto
- Método de pago:
  - Tarjeta
  - Transferencia
  - QR
- Estado de pago:
  - PENDIENTE (amarillo)
  - PROCESANDO (azul)
  - CONFIRMADO (verde)
  - RECHAZADO (rojo)
- Fecha de pago
- Estado de entrega:
  - PENDIENTE (amarillo)
  - EN_PREPARACIÓN (azul)
  - LISTA_PARA_RECOGER (celeste)
  - ENTREGADA (verde)
- Acciones:
  - Ver detalles
  - Confirmar pago (si es manual)
  - Rechazar pago
  - Actualizar entrega
  - Enviar mensaje

**Detalle de Pago:**

**Modal/Página con:**
- Información completa de la obra
- Información completa del ganador
- Historial de ofertas de este usuario
- Monto final
- Método de pago seleccionado
- Información de pago:
  - Si es tarjeta: ID de transacción
  - Si es transferencia/QR: voucher subido (imagen)
- Timeline de eventos:
  - Fecha de ganador
  - Fecha de envío de notificación
  - Fecha de intento de pago
  - Fecha de confirmación

**Acciones de Pago:**

1. **Confirmar Pago (para pagos manuales):**
   - Botón "Confirmar Pago"
   - Modal de confirmación
   - Campo para notas internas
   - Al confirmar:
     - Cambia estado a CONFIRMADO
     - Envía email a ganador
     - Cambia estado de obra a VENDIDA

2. **Rechazar Pago:**
   - Botón "Rechazar Pago"
   - Modal con razón del rechazo
   - Campo de texto obligatorio
   - Al rechazar:
     - Cambia estado a RECHAZADO
     - Envía email a ganador con razón
     - Permite reintento de pago

3. **Actualizar Estado de Entrega:**
   - Dropdown con opciones:
     - PENDIENTE
     - EN_PREPARACIÓN
     - LISTA_PARA_RECOGER
     - ENTREGADA
   - Al cambiar:
     - Guarda timestamp
     - Envía notificación a ganador
   - Si cambia a ENTREGADA:
     - Campo para notas de entrega
     - Firma digital (opcional)
     - Foto de entrega (opcional)

**Filtros:**
- Por estado de pago
- Por estado de entrega
- Por método de pago
- Por fecha
- Búsqueda por nombre de obra o ganador

**Estadísticas:**
- Total pagos confirmados: $XX,XXX
- Pagos pendientes: X
- Pagos procesando: X
- Entregas pendientes: X
- Entregas completadas: X

#### 4.2.7 Gestión de Usuarios

**Tabla de Usuarios Registrados:**

**Columnas:**
- Nombre
- Email
- Teléfono
- Fecha de registro
- Número de ofertas realizadas
- Obras ganadas
- Total gastado
- Estado:
  - Activo
  - Inactivo
  - Bloqueado
- Acciones:
  - Ver detalle
  - Enviar mensaje
  - Bloquear/Desbloquear

**Detalle de Usuario:**
- Información personal
- Historial de ofertas
- Obras ganadas
- Estado de pagos
- Notas administrativas

#### 4.2.8 Sistema de Reportes

**Reportes Disponibles:**

1. **Reporte de Ganadores:**
   - Formato: CSV
   - Columnas:
     - Obra
     - Artista
     - Ganador
     - Email
     - Teléfono
     - Monto
     - Estado de pago
     - Estado de entrega

2. **Reporte de Ofertas:**
   - Formato: CSV
   - Todas las ofertas con timestamp

3. **Reporte Financiero:**
   - Formato: CSV/PDF
   - Resumen de ventas
   - Comisiones
   - Totales

4. **Reporte de Participación:**
   - Total de usuarios
   - Usuarios con ofertas
   - Promedio de ofertas por usuario
   - Tasa de conversión

**Acciones:**
- Generar reporte
- Descargar
- Enviar por email

---

## 5. REGLAS DE NEGOCIO

### 5.1 Reglas de Ofertas

1. **Validación de Monto:**
   - Primera oferta en una obra: `monto >= precio_base`
   - Ofertas subsecuentes: `monto >= precio_actual + incremento_minimo`
   - No se permiten ofertas con decimales si el incremento mínimo es entero

2. **Restricciones de Usuario:**
   - Usuario debe estar autenticado
   - Usuario no puede ofertar si ya tiene la mejor oferta
   - Usuario puede ofertar múltiples veces si es superado

3. **Timing:**
   - No se puede ofertar antes del inicio del evento
   - No se puede ofertar después del cierre definitivo de la obra
   - Ofertas durante los últimos 10 minutos extienden el cierre

4. **Concurrencia:**
   - Si dos usuarios ofertan simultáneamente:
     - Se usa lock optimista o pesimista a nivel de base de datos
     - Solo la primera petición válida se acepta
     - La segunda recibe error: "Esta oferta fue superada"
   - Se debe prevenir race conditions

5. **Compra Inmediata:**
   - Si existe precio "Cómpralo ahora" y un usuario lo utiliza:
     - Cierra inmediatamente la subasta de esa obra
     - Usuario se convierte en ganador automático
     - No se permiten más ofertas en esa obra
     - Otras obras no se ven afectadas

### 5.2 Reglas de Cierre

1. **Cierre Programado:**
   - Cada obra tiene `fecha_cierre` inicial igual a la del evento
   - O puede tener cierre personalizado

2. **Extensión Dinámica:**
   - Si hay oferta dentro de los últimos 10 minutos: `nueva_fecha_cierre = ahora + 10 minutos`
   - No hay límite de extensiones
   - Cada obra se extiende independientemente

3. **Cierre Definitivo:**
   - Cuando pasan 10 minutos sin nuevas ofertas
   - Estado de obra cambia a "CERRADA"
   - Se identifica ganador (usuario con mejor oferta)
   - Se envían notificaciones

4. **Obra sin Ofertas:**
   - Si cierra sin ofertas:
     - Estado: "CERRADA"
     - Estado secundario: "NO_VENDIDA"
     - No se genera pago

### 5.3 Reglas de Pago

1. **Asignación de Pago:**
   - Solo el ganador puede acceder a página de pago
   - Link debe ser único y no transferible
   - Validación de token/ID de obra + usuario

2. **Plazo de Pago:**
   - Fecha límite: 72 horas después del cierre (configurable)
   - Recordatorios automáticos a las 24h y 48h
   - Después del plazo: se puede reasignar a segundo mejor postor (no en MVP)

3. **Confirmación de Pago:**
   - Pagos con tarjeta: confirmación automática
   - Pagos manuales (transferencia/QR): requieren confirmación de admin
   - Estado cambia a CONFIRMADO solo después de verificación

4. **Entrega:**
   - Solo se puede marcar como entregada después de pago confirmado
   - Fecha de entrega se registra

### 5.4 Reglas de Notificaciones

1. **Notificación de Nueva Oferta:**
   - Al usuario que ofertó: confirmación inmediata
   - Al usuario superado: notificación inmediata
   - A administradores: notificación agregada (cada 5 minutos)

2. **Notificación de Extensión:**
   - A todos los usuarios que hayan ofertado en esa obra
   - Notificación in-app (no email)

3. **Notificación de Ganador:**
   - Email inmediato al ganador
   - Email a administradores con resumen
   - Include link directo a pago

4. **Recordatorios:**
   - No enviar más de 1 email por hora por usuario
   - Respetar preferencias de notificación

### 5.5 Reglas de Administración

1. **Edición de Obras:**
   - Se puede editar en cualquier momento
   - Si tiene ofertas:
     - No se puede reducir precio base por debajo del precio actual
     - No se puede reducir incremento mínimo
     - No se puede eliminar
   - Cambios en descripción/imágenes: permitidos siempre

2. **Cierre Manual:**
   - Admin puede cerrar manualmente una obra
   - Requiere confirmación
   - Si tiene ofertas: mejor postor se convierte en ganador
   - Si no tiene ofertas: marca como NO_VENDIDA

3. **Gestión de Pagos:**
   - Solo admin puede confirmar/rechazar pagos manuales
   - Confirmación de pago es irreversible
   - Marcado de entrega requiere confirmación

---

## 6. MODELO DE DATOS

### 6.1 Esquema de Base de Datos

#### Tabla: usuarios
```sql
CREATE TABLE usuarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id         VARCHAR(255) UNIQUE,
  email             VARCHAR(255) UNIQUE NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  telefono          VARCHAR(50),
  avatar_url        TEXT,
  rol               VARCHAR(20) DEFAULT 'USER', -- USER, ADMIN
  estado            VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO, INACTIVO, BLOQUEADO
  acepto_terminos   BOOLEAN DEFAULT FALSE,
  fecha_registro    TIMESTAMP DEFAULT NOW(),
  ultima_sesion     TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);
```

#### Tabla: evento
```sql
CREATE TABLE evento (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            VARCHAR(255) NOT NULL,
  organizacion      VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  logo_url          TEXT,
  banner_url        TEXT,
  imagenes          TEXT[], -- Array de URLs
  fecha_inicio      TIMESTAMP NOT NULL,
  fecha_cierre      TIMESTAMP NOT NULL,
  email_contacto    VARCHAR(255),
  telefono_contacto VARCHAR(50),
  mensaje_bienvenida TEXT,
  terminos          TEXT,
  estado            VARCHAR(20) DEFAULT 'ACTIVO', -- BORRADOR, ACTIVO, FINALIZADO
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- Solo debe haber un evento activo a la vez en el MVP
CREATE UNIQUE INDEX idx_evento_activo ON evento(estado) WHERE estado = 'ACTIVO';
```

#### Tabla: obras
```sql
CREATE TABLE obras (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id         UUID REFERENCES evento(id) ON DELETE CASCADE,
  nombre            VARCHAR(255) NOT NULL,
  artista           VARCHAR(255) NOT NULL,
  descripcion       TEXT NOT NULL,
  tecnica           VARCHAR(100),
  dimensiones       VARCHAR(100),
  anio              INTEGER,
  info_adicional    TEXT,
  imagen_principal  TEXT NOT NULL,
  imagenes          TEXT[], -- Galería adicional
  precio_base       DECIMAL(10,2) NOT NULL CHECK (precio_base > 0),
  incremento_minimo DECIMAL(10,2) NOT NULL CHECK (incremento_minimo > 0),
  precio_actual     DECIMAL(10,2) DEFAULT 0,
  precio_comprar_ahora DECIMAL(10,2) CHECK (precio_comprar_ahora IS NULL OR precio_comprar_ahora > precio_base),
  mejor_postor_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_cierre      TIMESTAMP NOT NULL,
  fecha_cierre_original TIMESTAMP NOT NULL, -- Para tracking de extensiones
  numero_extensiones INTEGER DEFAULT 0,
  numero_ofertas    INTEGER DEFAULT 0,
  estado            VARCHAR(20) DEFAULT 'BORRADOR', -- BORRADOR, PUBLICADA, ACTIVA, EXTENDIDA, CERRADA, VENDIDA, NO_VENDIDA
  compra_inmediata_usada BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_obras_evento ON obras(evento_id);
CREATE INDEX idx_obras_estado ON obras(estado);
CREATE INDEX idx_obras_fecha_cierre ON obras(fecha_cierre);
CREATE INDEX idx_obras_mejor_postor ON obras(mejor_postor_id);
```

#### Tabla: ofertas
```sql
CREATE TABLE ofertas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id           UUID REFERENCES obras(id) ON DELETE CASCADE,
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  monto             DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  precio_anterior   DECIMAL(10,2), -- Para tracking
  es_compra_inmediata BOOLEAN DEFAULT FALSE,
  estado            VARCHAR(20) DEFAULT 'ACTIVA', -- ACTIVA, SUPERADA, GANADORA, PERDIDA
  ip_address        VARCHAR(50),
  user_agent        TEXT,
  fecha_oferta      TIMESTAMP DEFAULT NOW(),
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ofertas_obra ON ofertas(obra_id);
CREATE INDEX idx_ofertas_usuario ON ofertas(usuario_id);
CREATE INDEX idx_ofertas_fecha ON ofertas(fecha_oferta DESC);
CREATE INDEX idx_ofertas_estado ON ofertas(estado);

-- Para evitar duplicados en ofertas simultáneas
CREATE INDEX idx_ofertas_obra_fecha ON ofertas(obra_id, fecha_oferta DESC);
```

#### Tabla: pagos
```sql
CREATE TABLE pagos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id           UUID REFERENCES obras(id) ON DELETE CASCADE,
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  monto             DECIMAL(10,2) NOT NULL,
  metodo            VARCHAR(50) NOT NULL, -- TARJETA, TRANSFERENCIA, QR
  estado_pago       VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PROCESANDO, CONFIRMADO, RECHAZADO
  estado_entrega    VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, EN_PREPARACION, LISTA_PARA_RECOGER, ENTREGADA
  
  -- Datos específicos según método
  transaccion_id    VARCHAR(255), -- ID de pasarela de pago
  voucher_url       TEXT, -- URL del voucher subido
  comprobante_url   TEXT, -- URL del comprobante
  
  -- Tracking
  fecha_pago        TIMESTAMP,
  fecha_confirmacion TIMESTAMP,
  fecha_entrega     TIMESTAMP,
  confirmado_por    UUID REFERENCES usuarios(id), -- Admin que confirmó
  entregado_por     UUID REFERENCES usuarios(id), -- Admin que marcó entrega
  
  -- Notas
  notas_internas    TEXT,
  razon_rechazo     TEXT,
  notas_entrega     TEXT,
  
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pagos_obra ON pagos(obra_id);
CREATE INDEX idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX idx_pagos_estado_pago ON pagos(estado_pago);
CREATE INDEX idx_pagos_estado_entrega ON pagos(estado_entrega);
CREATE UNIQUE INDEX idx_pagos_obra_usuario ON pagos(obra_id, usuario_id);
```

#### Tabla: notificaciones
```sql
CREATE TABLE notificaciones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo              VARCHAR(50) NOT NULL, -- OFERTA_CONFIRMADA, OFERTA_SUPERADA, GANASTE, RECORDATORIO_PAGO, etc.
  titulo            VARCHAR(255) NOT NULL,
  mensaje           TEXT NOT NULL,
  
  -- Referencias
  obra_id           UUID REFERENCES obras(id) ON DELETE SET NULL,
  oferta_id         UUID REFERENCES ofertas(id) ON DELETE SET NULL,
  
  -- Estado
  leida             BOOLEAN DEFAULT FALSE,
  enviada_email     BOOLEAN DEFAULT FALSE,
  fecha_envio_email TIMESTAMP,
  
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
```

#### Tabla: logs_actividad (para auditoría)
```sql
CREATE TABLE logs_actividad (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_accion       VARCHAR(50) NOT NULL, -- LOGIN, OFERTA, PAGO, ADMIN_EDIT, etc.
  entidad_tipo      VARCHAR(50), -- obra, usuario, pago, etc.
  entidad_id        UUID,
  descripcion       TEXT,
  metadata          JSONB, -- Datos adicionales
  ip_address        VARCHAR(50),
  user_agent        TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_actividad(usuario_id);
CREATE INDEX idx_logs_tipo ON logs_actividad(tipo_accion);
CREATE INDEX idx_logs_fecha ON logs_actividad(created_at DESC);
CREATE INDEX idx_logs_entidad ON logs_actividad(entidad_tipo, entidad_id);
```

### 6.2 Relaciones entre Entidades

```
evento (1) ←→ (N) obras
usuarios (1) ←→ (N) ofertas
obras (1) ←→ (N) ofertas
obras (1) ←→ (1) pagos
usuarios (1) ←→ (N) pagos
usuarios (1) ←→ (N) notificaciones
obras (1) → (1) usuarios (mejor_postor)
```

### 6.3 Estados y Transiciones

**Estados de Obra:**
```
BORRADOR → PUBLICADA → ACTIVA → EXTENDIDA → CERRADA → VENDIDA
                                         └→ NO_VENDIDA
```

**Estados de Oferta:**
```
ACTIVA → SUPERADA
      → GANADORA
      → PERDIDA
```

**Estados de Pago:**
```
PENDIENTE → PROCESANDO → CONFIRMADO
                      → RECHAZADO → PENDIENTE (reintento)
```

**Estados de Entrega:**
```
PENDIENTE → EN_PREPARACION → LISTA_PARA_RECOGER → ENTREGADA
```

---

## 7. FLUJOS CRÍTICOS PASO A PASO

### 7.1 Flujo de Registro e Inicio de Sesión

**Actor:** Usuario (Postor)

**Pasos:**

1. Usuario accede a la Web Pública
2. Click en "Iniciar Sesión" o "Registrarse"
3. Sistema muestra modal/página de autenticación
4. Usuario click en "Continuar con Google"
5. Redirección a Google OAuth:
   - Sistema envía: client_id, redirect_uri, scope
   - Google valida y muestra pantalla de consentimiento
6. Usuario autoriza la aplicación
7. Google redirecciona a callback con authorization code
8. Backend:
   - Intercambia code por access_token con Google
   - Obtiene información del usuario (email, nombre, avatar)
   - Busca usuario en base de datos por google_id o email
9. **Si es usuario nuevo:**
   - Crear registro en tabla `usuarios`
   - Estado: ACTIVO
   - Rol: USER
   - Redireccionar a formulario de completar perfil:
     - Nombre completo (prellenado)
     - Teléfono (requerido)
     - Checkbox "Acepto términos y condiciones"
   - Usuario completa y envía
   - Backend actualiza registro
10. **Si es usuario existente:**
   - Actualizar última_sesion
11. Backend genera JWT con:
    - user_id
    - email
    - rol
    - Expiración: 7 días
12. Envía JWT en httpOnly cookie
13. Redirecciona a página principal
14. Frontend almacena estado de autenticación
15. Usuario ve interfaz personalizada con su nombre

**Logs generados:**
- LOG_ACTIVIDAD: tipo LOGIN

**Notificaciones:**
- Email de bienvenida (solo si es nuevo usuario)

---

### 7.2 Flujo de Realización de Oferta

**Actor:** Usuario autenticado (Postor)

**Precondiciones:**
- Usuario autenticado
- Obra en estado ACTIVA o EXTENDIDA
- Subasta no ha cerrado

**Pasos:**

1. Usuario navega a página de detalle de obra
2. Frontend carga:
   - Información de obra
   - Precio actual (vía WebSocket para tiempo real)
   - Historial de ofertas
3. Usuario ingresa monto en input
4. Frontend valida en tiempo real:
   - Monto >= precio_base (si no hay ofertas)
   - Monto >= precio_actual + incremento_minimo (si hay ofertas)
   - Mostrar feedback visual (verde/rojo)
5. Usuario click "Realizar Oferta"
6. Frontend:
   - Valida nuevamente
   - Deshabilita botón (loading state)
   - Envía POST a `/api/ofertas`
7. Backend recibe request:
   ```json
   {
     "obra_id": "uuid",
     "monto": 1500.00
   }
   ```
8. **Validación Backend (crítico para concurrencia):**
   ```sql
   BEGIN TRANSACTION;
   
   -- Lock de la obra para evitar race conditions
   SELECT * FROM obras WHERE id = ? FOR UPDATE;
   
   -- Validaciones:
   a) Obra existe y está activa
   b) Usuario autenticado
   c) Usuario no es el mejor_postor actual
   d) Fecha actual < fecha_cierre
   e) Monto >= precio_base (si primera oferta)
   f) Monto >= precio_actual + incremento_minimo (si hay ofertas)
   
   -- Si todas pasan:
   INSERT INTO ofertas (obra_id, usuario_id, monto, precio_anterior, estado)
   VALUES (?, ?, ?, ?, 'ACTIVA');
   
   -- Actualizar obra:
   UPDATE obras 
   SET precio_actual = ?,
       mejor_postor_id = ?,
       numero_ofertas = numero_ofertas + 1,
       updated_at = NOW()
   WHERE id = ?;
   
   -- Actualizar ofertas anteriores del mismo usuario:
   UPDATE ofertas
   SET estado = 'SUPERADA'
   WHERE obra_id = ? AND usuario_id = ? AND estado = 'ACTIVA';
   
   -- Actualizar ofertas de otros usuarios:
   UPDATE ofertas
   SET estado = 'SUPERADA'
   WHERE obra_id = ? AND usuario_id != ? AND estado = 'ACTIVA';
   
   COMMIT;
   ```

9. **Verificar extensión de tiempo:**
   ```javascript
   const tiempoRestante = obra.fecha_cierre - now();
   if (tiempoRestante < 10 * 60 * 1000) { // Menos de 10 minutos
     const nuevaFechaCierre = now() + (10 * 60 * 1000);
     
     UPDATE obras
     SET fecha_cierre = nuevaFechaCierre,
         numero_extensiones = numero_extensiones + 1,
         estado = 'EXTENDIDA'
     WHERE id = ?;
   }
   ```

10. **Generar notificaciones:**
    - Al usuario que ofertó:
      ```
      Tipo: OFERTA_CONFIRMADA
      Mensaje: "Tu oferta de $X,XXX fue registrada exitosamente"
      ```
    - Al usuario superado (si existe):
      ```
      Tipo: OFERTA_SUPERADA
      Mensaje: "Tu oferta de $X,XXX fue superada. Nueva oferta: $Y,YYY"
      ```
    - A administradores:
      ```
      Tipo: NUEVA_OFERTA_ADMIN
      Mensaje: "Nueva oferta de $X,XXX en [Obra] por [Usuario]"
      ```

11. **Enviar eventos WebSocket:**
    - A todos los clientes conectados en esa obra:
      ```json
      {
        "tipo": "NUEVA_OFERTA",
        "obra_id": "uuid",
        "precio_actual": 1500.00,
        "numero_ofertas": 5
      }
      ```
    - Si hubo extensión:
      ```json
      {
        "tipo": "EXTENSION_TIEMPO",
        "obra_id": "uuid",
        "nueva_fecha_cierre": "2026-02-20T20:10:00Z",
        "numero_extension": 2
      }
      ```

12. Backend responde a frontend:
    ```json
    {
      "success": true,
      "message": "Oferta realizada exitosamente",
      "data": {
        "oferta_id": "uuid",
        "monto": 1500.00,
        "precio_actual": 1500.00,
        "mejor_postor": true,
        "extension_aplicada": true,
        "nueva_fecha_cierre": "2026-02-20T20:10:00Z"
      }
    }
    ```

13. Frontend actualiza UI:
    - Muestra toast de éxito
    - Actualiza precio actual
    - Actualiza contador regresivo
    - Actualiza historial de ofertas
    - Muestra badge "Tu oferta es la mejor"

14. **Envío de emails (asíncrono via queue):**
    - Job agregado a cola con tipo `enviar_notificacion_oferta`
    - Worker procesa en background
    - Envía emails correspondientes

**Logs generados:**
- LOG_ACTIVIDAD:
  - tipo: OFERTA
  - entidad_tipo: obra
  - entidad_id: obra_id
  - metadata: {monto, precio_anterior, extension_aplicada}

**Manejo de Errores:**

Si falla validación:
```json
{
  "success": false,
  "error": "OFERTA_INVALIDA",
  "message": "El monto mínimo debe ser $1,250.00",
  "data": {
    "monto_minimo": 1250.00,
    "precio_actual": 1200.00
  }
}
```

Frontend muestra error y permite reintento.

---

### 7.3 Flujo de Extensión Automática

**Actor:** Sistema (Job Scheduler)

**Trigger:** Oferta realizada dentro de los últimos 10 minutos antes del cierre

**Pasos:**

1. Al realizar oferta (ver flujo 7.2, paso 9):
   - Sistema calcula: `tiempoRestante = fecha_cierre - ahora`
2. Si `tiempoRestante < 10 minutos`:
   - Calcular nueva fecha: `nuevaFechaCierre = ahora + 10 minutos`
   - Actualizar obra:
     ```sql
     UPDATE obras
     SET fecha_cierre = nuevaFechaCierre,
         numero_extensiones = numero_extensiones + 1,
         estado = 'EXTENDIDA'
     WHERE id = ?;
     ```
3. Enviar evento WebSocket a todos los clientes:
   ```json
   {
     "tipo": "EXTENSION_TIEMPO",
     "obra_id": "uuid",
     "nueva_fecha_cierre": "2026-02-20T20:10:00Z",
     "minutos_agregados": 10,
     "numero_extension": 3
   }
   ```
4. Frontend actualiza:
   - Contador regresivo
   - Badge de estado a "Extendida"
   - Toast: "La subasta se extendió 10 minutos"
5. Notificación in-app a usuarios que han ofertado:
   ```
   "La subasta de [Obra] se extendió hasta las 20:10"
   ```
6. **No se envía email** para no saturar
7. Log de actividad:
   ```
   tipo: EXTENSION_AUTOMATICA
   entidad: obra
   metadata: {extension_numero, minutos_agregados, nueva_fecha}
   ```

**Ejemplo de Múltiples Extensiones:**

```
Cierre original: 20:00:00

19:52:00 → Oferta → Nueva fecha: 20:02:00 (extensión #1)
19:58:00 → Oferta → Nueva fecha: 20:08:00 (extensión #2)
20:07:30 → Oferta → Nueva fecha: 20:17:30 (extensión #3)
20:17:30 → Sin ofertas → CIERRE DEFINITIVO
```

---

### 7.4 Flujo de Cierre de Subasta

**Actor:** Sistema (Job Scheduler)

**Precondición:** `fecha_cierre` ha pasado y no hay nuevas ofertas

**Pasos:**

1. **Monitor de Cierre (cron job cada 1 minuto):**
   ```sql
   SELECT id, nombre, fecha_cierre, mejor_postor_id, precio_actual
   FROM obras
   WHERE estado IN ('ACTIVA', 'EXTENDIDA')
   AND fecha_cierre <= NOW()
   ORDER BY fecha_cierre ASC;
   ```

2. Para cada obra encontrada:

3. **Verificar que no hubo ofertas recientes:**
   ```sql
   SELECT MAX(fecha_oferta) as ultima_oferta
   FROM ofertas
   WHERE obra_id = ?;
   
   -- Si ultima_oferta es dentro de los últimos 10 minutos:
   -- Aplicar extensión (ver flujo 7.3)
   -- Continuar con siguiente obra
   ```

4. **Si no hay ofertas recientes, proceder con cierre:**
   ```sql
   BEGIN TRANSACTION;
   
   -- Actualizar estado de obra
   UPDATE obras
   SET estado = 'CERRADA',
       updated_at = NOW()
   WHERE id = ?;
   
   -- Si tiene ofertas (hay ganador)
   IF mejor_postor_id IS NOT NULL:
     -- Marcar oferta ganadora
     UPDATE ofertas
     SET estado = 'GANADORA'
     WHERE obra_id = ? 
     AND usuario_id = mejor_postor_id
     AND monto = precio_actual;
     
     -- Marcar otras ofertas como perdidas
     UPDATE ofertas
     SET estado = 'PERDIDA'
     WHERE obra_id = ?
     AND estado = 'SUPERADA';
     
     -- Crear registro de pago
     INSERT INTO pagos (obra_id, usuario_id, monto, metodo, estado_pago)
     VALUES (?, ?, ?, NULL, 'PENDIENTE');
     
     -- Actualizar estado de obra
     UPDATE obras SET estado = 'CERRADA' WHERE id = ?;
   
   ELSE:
     -- Sin ofertas
     UPDATE obras SET estado = 'NO_VENDIDA' WHERE id = ?;
   
   COMMIT;
   ```

5. **Si hay ganador:**
   - Generar notificación para ganador:
     ```
     Tipo: GANASTE_SUBASTA
     Título: "¡Felicidades! Ganaste la subasta"
     Mensaje: "Ganaste [Obra] por $X,XXX. Procede con el pago."
     ```
   - Enviar email a ganador:
     ```
     Asunto: "¡Ganaste la subasta de [Obra]!"
     Contenido:
     - Felicitación
     - Detalles de la obra
     - Monto a pagar
     - Link directo a página de pago (con token único)
     - Fecha límite de pago
     ```
   - Notificar a administradores:
     ```
     Tipo: SUBASTA_CERRADA_ADMIN
     Mensaje: "[Obra] cerrada - Ganador: [Usuario] - Monto: $X,XXX"
     ```

6. **Si no hay ganador:**
   - Notificar solo a administradores:
     ```
     Mensaje: "[Obra] cerrada sin ofertas"
     ```

7. **Enviar WebSocket a todos los clientes:**
   ```json
   {
     "tipo": "SUBASTA_CERRADA",
     "obra_id": "uuid",
     "tiene_ganador": true,
     "precio_final": 1500.00
   }
   ```

8. Frontend actualiza:
   - Estado a "Cerrada"
   - Deshabilitar input de oferta
   - Mostrar mensaje: "Esta subasta ha finalizado"
   - Si el usuario es ganador: mostrar botón "Proceder al Pago"

9. **Dashboard admin se actualiza:**
   - Obra pasa a sección de "Cerradas"
   - Aparece en "Pagos Pendientes"
   - Métricas se actualizan

10. Log de actividad:
    ```
    tipo: CIERRE_SUBASTA
    entidad: obra
    metadata: {
      tiene_ganador,
      ganador_id,
      precio_final,
      numero_ofertas,
      numero_extensiones
    }
    ```

---

### 7.5 Flujo de "Cómpralo Ahora"

**Actor:** Usuario autenticado (Postor)

**Precondición:**
- Obra tiene configurado `precio_comprar_ahora`
- Obra está en estado ACTIVA o EXTENDIDA

**Pasos:**

1. Usuario en página de detalle de obra
2. Ve botón destacado: "Cómpralo Ahora por $5,000"
3. Usuario click en botón
4. Frontend muestra modal de confirmación:
   ```
   "¿Estás seguro que deseas comprar esta obra por $5,000?"
   "Esta acción cerrará la subasta inmediatamente y no se puede deshacer."
   
   [Cancelar]  [Confirmar Compra]
   ```
5. Usuario confirma
6. Frontend:
   - Deshabilita botón
   - Loading state
   - POST a `/api/ofertas/comprar-ahora`
7. Backend recibe:
   ```json
   {
     "obra_id": "uuid"
   }
   ```
8. **Validación Backend:**
   ```sql
   BEGIN TRANSACTION;
   
   SELECT * FROM obras 
   WHERE id = ? 
   AND precio_comprar_ahora IS NOT NULL
   AND estado IN ('ACTIVA', 'EXTENDIDA')
   AND compra_inmediata_usada = FALSE
   FOR UPDATE;
   
   -- Validaciones:
   a) Obra existe
   b) Tiene precio_comprar_ahora
   c) No ha cerrado
   d) No fue usada la compra inmediata antes
   e) Usuario autenticado
   
   -- Si todas pasan:
   -- Crear oferta especial
   INSERT INTO ofertas (
     obra_id, usuario_id, monto, es_compra_inmediata, estado
   ) VALUES (?, ?, precio_comprar_ahora, TRUE, 'GANADORA');
   
   -- Actualizar obra (CIERRE INMEDIATO)
   UPDATE obras
   SET estado = 'CERRADA',
       precio_actual = precio_comprar_ahora,
       mejor_postor_id = ?,
       compra_inmediata_usada = TRUE,
       numero_ofertas = numero_ofertas + 1,
       updated_at = NOW()
   WHERE id = ?;
   
   -- Marcar ofertas anteriores como perdidas
   UPDATE ofertas
   SET estado = 'PERDIDA'
   WHERE obra_id = ?
   AND usuario_id != ?;
   
   -- Crear registro de pago
   INSERT INTO pagos (obra_id, usuario_id, monto, estado_pago)
   VALUES (?, ?, precio_comprar_ahora, 'PENDIENTE');
   
   COMMIT;
   ```

9. **Generar notificaciones:**
   - Al comprador:
     ```
     Tipo: COMPRA_INMEDIATA_EXITOSA
     Mensaje: "¡Compraste [Obra] por $5,000! Procede con el pago."
     ```
   - A postores anteriores:
     ```
     Tipo: SUBASTA_CERRADA_COMPRA_INMEDIATA
     Mensaje: "La subasta de [Obra] fue cerrada por compra inmediata."
     ```
   - A administradores:
     ```
     Tipo: COMPRA_INMEDIATA_ADMIN
     Mensaje: "[Usuario] usó compra inmediata en [Obra] por $5,000"
     ```

10. **Enviar WebSocket:**
    ```json
    {
      "tipo": "COMPRA_INMEDIATA",
      "obra_id": "uuid",
      "precio_final": 5000.00,
      "comprador": "Anónimo"
    }
    ```

11. Backend responde:
    ```json
    {
      "success": true,
      "message": "Compra realizada exitosamente",
      "data": {
        "obra_id": "uuid",
        "monto": 5000.00,
        "pago_id": "uuid",
        "link_pago": "/pago/uuid"
      }
    }
    ```

12. Frontend:
    - Muestra toast: "¡Compra exitosa!"
    - Redirecciona a página de pago automáticamente
    - Modal de felicitación

13. **Envío de emails (asíncrono):**
    - Email a comprador con detalles y link de pago
    - Email a postores notificando cierre

14. Dashboard admin actualiza:
    - Obra aparece como "Cerrada - Venta Inmediata"
    - Pago pendiente

15. Log de actividad:
    ```
    tipo: COMPRA_INMEDIATA
    entidad: obra
    metadata: {comprador_id, monto, ofertas_anteriores}
    ```

**Manejo de Errores:**

Si otro usuario usó la compra inmediata milisegundos antes:
```json
{
  "success": false,
  "error": "COMPRA_NO_DISPONIBLE",
  "message": "Esta opción ya no está disponible. La obra fue vendida."
}
```

---

### 7.6 Flujo de Pago

**Actor:** Usuario ganador

**Precondición:**
- Usuario ganó la subasta (es mejor_postor)
- Registro de pago creado en estado PENDIENTE

**Pasos:**

1. Usuario accede vía:
   - Link en email: `/pago/{token}`
   - Botón en "Mis Ofertas"
   - Notificación in-app

2. Frontend valida acceso:
   ```
   GET /api/pagos/{pago_id}/verificar
   ```

3. Backend valida:
   ```sql
   SELECT p.*, o.nombre, o.imagen_principal, o.artista, o.precio_actual
   FROM pagos p
   JOIN obras o ON p.obra_id = o.id
   WHERE p.id = ?
   AND p.usuario_id = ?
   AND p.estado_pago IN ('PENDIENTE', 'RECHAZADO');
   ```

4. Si válido, Frontend muestra página de pago con:
   - Resumen de compra
   - Selección de método de pago
   - Formulario correspondiente

5. **Flujo según método:**

---

#### 5a. Pago con Tarjeta (Stripe/Culqi)

1. Usuario selecciona "Tarjeta"
2. Frontend carga componente de pasarela (Stripe Elements)
3. Usuario ingresa datos de tarjeta
4. Frontend valida con pasarela (tokenización)
5. Usuario click "Pagar $X,XXX"
6. Frontend:
   ```javascript
   const {token} = await stripe.createToken(card);
   
   POST /api/pagos/{pago_id}/procesar-tarjeta
   {
     "token": "tok_xxx",
     "monto": 1500.00
   }
   ```

7. Backend:
   ```javascript
   // Procesar con Stripe
   const charge = await stripe.charges.create({
     amount: monto * 100, // en centavos
     currency: 'usd',
     source: token,
     description: `Pago de ${obra.nombre}`
   });
   
   if (charge.status === 'succeeded') {
     // Actualizar pago
     UPDATE pagos
     SET estado_pago = 'CONFIRMADO',
         metodo = 'TARJETA',
         transaccion_id = charge.id,
         fecha_pago = NOW(),
         fecha_confirmacion = NOW()
     WHERE id = ?;
     
     // Actualizar obra
     UPDATE obras
     SET estado = 'VENDIDA'
     WHERE id = ?;
   }
   ```

8. Notificaciones:
   - Email a comprador: "Pago confirmado"
   - Email a admin: "Nuevo pago confirmado"
   - Notificación in-app

9. Frontend muestra página de éxito:
   - Checkmark verde
   - "¡Pago exitoso!"
   - Detalles de pago
   - Instrucciones de entrega
   - Número de referencia

---

#### 5b. Transferencia Bancaria

1. Usuario selecciona "Transferencia"
2. Frontend muestra:
   ```
   Realiza tu transferencia a:
   
   Banco: Banco XYZ
   Cuenta: 1234-5678-9012
   CCI: 001-234-567890123456
   Titular: Organización ABC
   Monto: $1,500.00
   Referencia: OBRA-uuid-corto
   ```

3. Usuario realiza transferencia por su cuenta
4. Usuario regresa, sube voucher:
   - Input file (JPG, PNG, PDF, máx 5MB)
   - Preview de imagen

5. Usuario click "Enviar Comprobante"
6. Frontend:
   ```javascript
   // Upload a storage (S3, Cloudinary)
   const url = await uploadFile(file);
   
   POST /api/pagos/{pago_id}/subir-voucher
   {
     "voucher_url": url
   }
   ```

7. Backend:
   ```sql
   UPDATE pagos
   SET estado_pago = 'PROCESANDO',
       metodo = 'TRANSFERENCIA',
       voucher_url = ?,
       fecha_pago = NOW()
   WHERE id = ?;
   ```

8. Notificaciones:
   - Al usuario: "Comprobante recibido. Validación en 24-48h"
   - A admin: "Nuevo comprobante para validar"

9. **En Panel Admin:**
   - Admin ve en "Pagos Pendientes"
   - Click en registro
   - Ve imagen del voucher
   - Opciones:
     - "Confirmar Pago"
     - "Rechazar" (con motivo)

10. **Si admin confirma:**
    ```sql
    UPDATE pagos
    SET estado_pago = 'CONFIRMADO',
        fecha_confirmacion = NOW(),
        confirmado_por = admin_id
    WHERE id = ?;
    
    UPDATE obras
    SET estado = 'VENDIDA'
    WHERE id = ?;
    ```
    
    - Email a usuario: "Pago confirmado"

11. **Si admin rechaza:**
    ```sql
    UPDATE pagos
    SET estado_pago = 'RECHAZADO',
        razon_rechazo = ?
    WHERE id = ?;
    ```
    
    - Email a usuario con razón y opción de reintentar

---

#### 5c. Pago por QR (Yape/Plin)

1. Usuario selecciona "Pago por QR"
2. Frontend solicita generar QR:
   ```
   GET /api/pagos/{pago_id}/generar-qr
   ```

3. Backend genera QR con información:
   ```javascript
   // Dependiendo del servicio (Yape, Plin, etc.)
   const qrData = {
     type: 'PAYMENT',
     merchant_id: 'xxx',
     amount: 1500.00,
     reference: obra_id
   };
   
   const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
   ```

4. Frontend muestra:
   - QR code grande
   - Instrucciones:
     ```
     1. Abre tu app de Yape/Plin
     2. Escanea este código QR
     3. Confirma el pago de $1,500.00
     4. Sube una captura de la confirmación
     ```
   - Input para subir captura

5. Usuario realiza pago y sube captura
6. Proceso similar a transferencia:
   - Estado: PROCESANDO
   - Admin valida manualmente
   - Confirma o rechaza

---

### 7.7 Flujo de Confirmación de Entrega

**Actor:** Administrador

**Precondición:**
- Pago confirmado
- Obra en estado VENDIDA

**Pasos:**

1. Admin accede a "Gestión de Pagos" en panel
2. Filtra por "Pago Confirmado" + "Entrega Pendiente"
3. Ve lista de obras listas para entrega
4. Click en registro específico
5. Modal de detalle muestra:
   - Información de obra
   - Datos del comprador (nombre, email, teléfono)
   - Monto pagado
   - Método de pago
   - Estado actual de entrega
   - Historial de cambios

6. **Actualizar Estado de Entrega:**
   
   - Dropdown con opciones:
     - PENDIENTE
     - EN_PREPARACION
     - LISTA_PARA_RECOGER
     - ENTREGADA
   
   - Admin selecciona nuevo estado
   - Si selecciona "EN_PREPARACION":
     - Fecha estimada de preparación (opcional)
   
   - Si selecciona "LISTA_PARA_RECOGER":
     - Instrucciones de recojo (textarea)
     - Fecha límite de recojo
   
   - Si selecciona "ENTREGADA":
     - **Formulario de confirmación:**
       - Fecha y hora de entrega (prellenado con NOW)
       - Recibido por (nombre de quien recogió)
       - Documento de identidad (opcional)
       - Notas de entrega (textarea)
       - Upload de foto de entrega (opcional)
       - Upload de firma digital (opcional)
       - Checkbox: "Confirmo que la obra fue entregada"

7. Admin click "Guardar Cambios"

8. Backend:
   ```sql
   UPDATE pagos
   SET estado_entrega = ?,
       fecha_entrega = CASE WHEN ? = 'ENTREGADA' THEN NOW() ELSE NULL END,
       entregado_por = ?,
       notas_entrega = ?,
       updated_at = NOW()
   WHERE id = ?;
   ```

9. **Generar notificación según estado:**

   - Si EN_PREPARACION:
     ```
     Email: "Tu obra está siendo preparada para entrega"
     ```
   
   - Si LISTA_PARA_RECOGER:
     ```
     Email: "Tu obra está lista para recoger"
     Incluir: instrucciones, dirección, horarios, fecha límite
     ```
   
   - Si ENTREGADA:
     ```
     Email: "Gracias por tu compra - Entrega confirmada"
     Incluir: fecha de entrega, agradecimiento, encuesta de satisfacción
     ```

10. Log de actividad:
    ```
    tipo: ACTUALIZACION_ENTREGA
    usuario_id: admin_id
    entidad: pago
    metadata: {
      estado_anterior,
      estado_nuevo,
      obra_id,
      comprador_id
    }
    ```

11. Dashboard actualiza métricas:
    - Entregas pendientes: -1
    - Entregas completadas: +1

12. Admin ve confirmación visual: "Estado actualizado"

**Vista de Seguimiento para Usuario:**

- En "Mis Ofertas" > Obras Ganadas, usuario ve:
  - Tarjeta con obra
  - Estado de pago: ✅ Confirmado
  - Estado de entrega: 
    - 🟡 Pendiente
    - 🔵 En preparación
    - 🟢 Lista para recoger (con instrucciones)
    - ✅ Entregada

---

## 8. CONSIDERACIONES TÉCNICAS IMPORTANTES

### 8.1 Manejo de Concurrencia en Ofertas

**Problema:**
Dos usuarios ofertan simultáneamente el mismo monto o montos superpuestos.

**Solución:**

1. **Lock Optimista:**
   ```sql
   -- Agregar columna version a tabla obras
   ALTER TABLE obras ADD COLUMN version INTEGER DEFAULT 0;
   
   -- Al actualizar:
   UPDATE obras
   SET precio_actual = ?,
       mejor_postor_id = ?,
       version = version + 1
   WHERE id = ?
   AND version = ?; -- Version leída previamente
   
   -- Si affected_rows = 0, hubo conflicto
   -- Reintentar o rechazar
   ```

2. **Lock Pesimista (recomendado para MVP):**
   ```sql
   BEGIN TRANSACTION;
   
   SELECT * FROM obras 
   WHERE id = ? 
   FOR UPDATE; -- Bloquea la fila
   
   -- Validar y insertar oferta
   -- Actualizar obra
   
   COMMIT; -- Libera el lock
   ```

3. **Redis para Lock Distribuido:**
   ```javascript
   const redlock = new Redlock([redisClient]);
   
   const lock = await redlock.lock(`obra:${obraId}:lock`, 1000);
   
   try {
     // Procesar oferta
   } finally {
     await lock.unlock();
   }
   ```

**Estrategia Recomendada:**
- Lock pesimista a nivel de base de datos
- Timeout de 5 segundos máximo
- Si falla, devolver error específico al usuario

---

### 8.2 Actualización en Tiempo Real

**Implementación con WebSocket (Socket.io):**

**Backend:**
```javascript
// server.js
const io = require('socket.io')(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Middleware de autenticación
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyToken(token);
    socket.userId = user.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.userId);
  
  // Cliente se suscribe a una obra específica
  socket.on('suscribir_obra', (obraId) => {
    socket.join(`obra:${obraId}`);
  });
  
  // Cliente se desuscribe
  socket.on('desuscribir_obra', (obraId) => {
    socket.leave(`obra:${obraId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Función para emitir eventos
function emitirNuevaOferta(obraId, data) {
  io.to(`obra:${obraId}`).emit('nueva_oferta', data);
}

function emitirExtensionTiempo(obraId, data) {
  io.to(`obra:${obraId}`).emit('extension_tiempo', data);
}

function emitirCierreSubasta(obraId, data) {
  io.to(`obra:${obraId}`).emit('subasta_cerrada', data);
}
```

**Frontend:**
```javascript
// hooks/useRealtimeObra.js
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_WS_URL, {
  auth: {
    token: getAuthToken()
  }
});

export function useRealtimeObra(obraId) {
  const [precioActual, setPrecioActual] = useState(0);
  const [fechaCierre, setFechaCierre] = useState(null);
  
  useEffect(() => {
    // Suscribirse a la obra
    socket.emit('suscribir_obra', obraId);
    
    // Escuchar eventos
    socket.on('nueva_oferta', (data) => {
      if (data.obra_id === obraId) {
        setPrecioActual(data.precio_actual);
        // Actualizar UI
        toast.info('Nueva oferta recibida');
      }
    });
    
    socket.on('extension_tiempo', (data) => {
      if (data.obra_id === obraId) {
        setFechaCierre(data.nueva_fecha_cierre);
        toast.warning('¡La subasta se extendió 10 minutos!');
      }
    });
    
    socket.on('subasta_cerrada', (data) => {
      if (data.obra_id === obraId) {
        // Actualizar estado
        toast.success('La subasta ha finalizado');
      }
    });
    
    // Cleanup
    return () => {
      socket.emit('desuscribir_obra', obraId);
      socket.off('nueva_oferta');
      socket.off('extension_tiempo');x
      socket.off('subasta_cerrada');
    };
  }, [obraId]);
  
  return { precioActual, fechaCierre };
}
```

**Alternativa: Polling (más simple para MVP):**
```javascript
// Frontend hace polling cada 5 segundos
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await fetch(`/api/obras/${obraId}/estado`);
    setPrecioActual(data.precio_actual);
  }, 5000);
  
  return () => clearInterval(interval);
}, [obraId]);
```

**Recomendación:**
- WebSocket para Web Pública (mejor UX)
- Polling para Panel Admin (suficiente)

---

### 8.3 Seguridad del Panel Admin

**Medidas de Seguridad:**

1. **Autenticación Reforzada:**
   ```javascript
   // Middleware de autenticación admin
   async function requireAdmin(req, res, next) {
     const token = req.cookies.auth_token;
     
     if (!token) {
       return res.status(401).json({ error: 'No autenticado' });
     }
     
     const user = await verifyToken(token);
     
     if (user.rol !== 'ADMIN') {
       return res.status(403).json({ error: 'Acceso denegado' });
     }
     
     req.user = user;
     next();
   }
   
   // Aplicar a todas las rutas admin
   app.use('/api/admin/*', requireAdmin);
   ```

2. **CORS Estricto:**
   ```javascript
   const corsOptions = {
     origin: (origin, callback) => {
       const allowedOrigins = [
         'https://admin.subasta.com',
         'http://localhost:3001' // Solo en dev
       ];
       
       if (allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('No permitido por CORS'));
       }
     },
     credentials: true
   };
   
   app.use('/api/admin/*', cors(corsOptions));
   ```

3. **Rate Limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const adminLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutos
     max: 100, // Max 100 requests por IP
     message: 'Demasiadas peticiones'
   });
   
   app.use('/api/admin/*', adminLimiter);
   ```

4. **Logs de Auditoría:**
   - Todas las acciones admin se registran en `logs_actividad`
   - Incluir: IP, user agent, timestamp, acción, entidad afectada

5. **Whitelist de IPs (opcional pero recomendado):**
   ```javascript
   const allowedIPs = process.env.ADMIN_IPS.split(',');
   
   function checkIP(req, res, next) {
     const clientIP = req.ip;
     
     if (!allowedIPs.includes(clientIP)) {
       return res.status(403).json({ error: 'IP no autorizada' });
     }
     
     next();
   }
   ```

6. **Autenticación Multifactor (recomendado):**
   - Implementar TOTP (Google Authenticator)
   - Requerir en acciones críticas (confirmar pagos, eliminar obras)

---

### 8.4 Validaciones Backend Obligatorias

**Nunca confiar en validaciones frontend. Siempre revalidar en backend:**

1. **Validación de Ofertas:**
   ```javascript
   async function validarOferta(obraId, usuarioId, monto) {
     // 1. Obra existe y está activa
     const obra = await getObra(obraId);
     if (!obra || !['ACTIVA', 'EXTENDIDA'].includes(obra.estado)) {
       throw new Error('La obra no está disponible para ofertas');
     }
     
     // 2. Subasta no ha cerrado
     if (new Date() > new Date(obra.fecha_cierre)) {
       throw new Error('La subasta ha finalizado');
     }
     
     // 3. Usuario no es el mejor postor
     if (obra.mejor_postor_id === usuarioId) {
       throw new Error('Ya tienes la mejor oferta');
     }
     
     // 4. Monto es válido
     const montoMinimo = obra.precio_actual > 0 
       ? obra.precio_actual + obra.incremento_minimo
       : obra.precio_base;
     
     if (monto < montoMinimo) {
       throw new Error(`El monto mínimo es $${montoMinimo}`);
     }
     
     return true;
   }
   ```

2. **Validación de Acceso a Pago:**
   ```javascript
   async function validarAccesoPago(pagoId, usuarioId) {
     const pago = await getPago(pagoId);
     
     if (!pago) {
       throw new Error('Pago no encontrado');
     }
     
     if (pago.usuario_id !== usuarioId) {
       throw new Error('No tienes acceso a este pago');
     }
     
     if (pago.estado_pago === 'CONFIRMADO') {
       throw new Error('Este pago ya fue confirmado');
     }
     
     return pago;
   }
   ```

3. **Validación de Edición de Obra:**
   ```javascript
   async function validarEdicionObra(obraId, nuevosDatos) {
     const obra = await getObra(obraId);
     
     // Si tiene ofertas, no permitir ciertos cambios
     if (obra.numero_ofertas > 0) {
       if (nuevosDatos.precio_base < obra.precio_actual) {
         throw new Error('No puedes reducir el precio base por debajo del precio actual');
       }
       
       if (nuevosDatos.incremento_minimo < obra.incremento_minimo) {
         throw new Error('No puedes reducir el incremento mínimo');
       }
     }
     
     return true;
   }
   ```

4. **Sanitización de Inputs:**
   ```javascript
   const validator = require('validator');
   
   function sanitizeInput(data) {
     return {
       nombre: validator.escape(data.nombre),
       email: validator.normalizeEmail(data.email),
       descripcion: validator.stripLow(data.descripcion),
       // etc.
     };
   }
   ```

---

### 8.5 Manejo Correcto de Estados

**Estado de Obra - Máquina de Estados:**

```javascript
const ESTADOS_OBRA = {
  BORRADOR: 'BORRADOR',
  PUBLICADA: 'PUBLICADA',
  ACTIVA: 'ACTIVA',
  EXTENDIDA: 'EXTENDIDA',
  CERRADA: 'CERRADA',
  VENDIDA: 'VENDIDA',
  NO_VENDIDA: 'NO_VENDIDA'
};

const TRANSICIONES_VALIDAS = {
  BORRADOR: ['PUBLICADA'],
  PUBLICADA: ['ACTIVA', 'BORRADOR'],
  ACTIVA: ['EXTENDIDA', 'CERRADA'],
  EXTENDIDA: ['EXTENDIDA', 'CERRADA'], // Puede extenderse múltiples veces
  CERRADA: ['VENDIDA', 'NO_VENDIDA'],
  VENDIDA: [], // Estado final
  NO_VENDIDA: [] // Estado final
};

async function cambiarEstadoObra(obraId, nuevoEstado) {
  const obra = await getObra(obraId);
  
  // Validar transición
  if (!TRANSICIONES_VALIDAS[obra.estado].includes(nuevoEstado)) {
    throw new Error(
      `Transición inválida: ${obra.estado} → ${nuevoEstado}`
    );
  }
  
  // Lógica específica por transición
  switch (nuevoEstado) {
    case 'ACTIVA':
      // Verificar que fecha de inicio ha pasado
      if (new Date() < new Date(evento.fecha_inicio)) {
        throw new Error('El evento aún no ha comenzado');
      }
      break;
      
    case 'CERRADA':
      // Verificar que fecha de cierre ha pasado
      if (new Date() < new Date(obra.fecha_cierre)) {
        throw new Error('La fecha de cierre aún no ha llegado');
      }
      break;
      
    case 'VENDIDA':
      // Verificar que hay pago confirmado
      const pago = await getPagoByObra(obraId);
      if (pago.estado_pago !== 'CONFIRMADO') {
        throw new Error('El pago no ha sido confirmado');
      }
      break;
  }
  
  // Actualizar estado
  await updateObra(obraId, { estado: nuevoEstado });
  
  // Log
  await logActividad({
    tipo: 'CAMBIO_ESTADO_OBRA',
    entidad_tipo: 'obra',
    entidad_id: obraId,
    metadata: {
      estado_anterior: obra.estado,
      estado_nuevo: nuevoEstado
    }
  });
}
```

**Job para Actualización Automática de Estados:**

```javascript
// Cron job que corre cada minuto
cron.schedule('* * * * *', async () => {
  // 1. Activar obras publicadas si el evento comenzó
  await db.query(`
    UPDATE obras
    SET estado = 'ACTIVA'
    WHERE estado = 'PUBLICADA'
    AND evento_id IN (
      SELECT id FROM evento 
      WHERE fecha_inicio <= NOW() 
      AND fecha_cierre > NOW()
    )
  `);
  
  // 2. Cerrar obras cuyo tiempo expiró
  const obrasParaCerrar = await db.query(`
    SELECT id FROM obras
    WHERE estado IN ('ACTIVA', 'EXTENDIDA')
    AND fecha_cierre <= NOW()
  `);
  
  for (const obra of obrasParaCerrar) {
    await procesarCierreObra(obra.id);
  }
});
```

---

### 8.6 Manejo de Errores

**Estructura de Respuesta de Error:**

```javascript
// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log detallado
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date()
  });
  
  // Respuesta al cliente
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'Error interno del servidor'
  };
  
  // No exponer detalles internos en producción
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
});
```

**Errores Personalizados:**

```javascript
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'AUTHORIZATION_ERROR';
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} no encontrado`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
  }
}

class ConcurrencyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConcurrencyError';
    this.statusCode = 409;
    this.code = 'CONCURRENCY_ERROR';
  }
}
```

**Uso:**

```javascript
async function realizarOferta(req, res, next) {
  try {
    const { obra_id, monto } = req.body;
    
    // Validaciones
    if (!monto || monto <= 0) {
      throw new ValidationError('Monto inválido', { monto });
    }
    
    const obra = await getObra(obra_id);
    if (!obra) {
      throw new NotFoundError('Obra');
    }
    
    // Intentar crear oferta
    const oferta = await crearOferta(obra_id, req.user.id, monto);
    
    res.json({
      success: true,
      data: oferta
    });
  } catch (err) {
    next(err); // Pasa al error handler global
  }
}
```

**Retry Logic para Concurrencia:**

```javascript
async function realizarOfertaConRetry(obraId, usuarioId, monto, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await crearOferta(obraId, usuarioId, monto);
    } catch (err) {
      if (err instanceof ConcurrencyError && attempt < maxRetries - 1) {
        attempt++;
        await sleep(100 * attempt); // Backoff exponencial
        continue;
      }
      throw err;
    }
  }
}
```

---

### 8.7 Estrategia de Notificaciones

**Queue de Notificaciones:**

```javascript
// Usando Bull
const notificacionQueue = new Queue('notificaciones', {
  redis: redisConfig
});

// Producer
async function enviarNotificacion(tipo, destinatarioId, data) {
  await notificacionQueue.add({
    tipo,
    destinatarioId,
    data,
    timestamp: new Date()
  });
}

// Consumer
notificacionQueue.process(async (job) => {
  const { tipo, destinatarioId, data } = job.data;
  
  // Obtener usuario
  const usuario = await getUsuario(destinatarioId);
  
  // Seleccionar template de email
  const template = getEmailTemplate(tipo, data);
  
  // Enviar email
  await sendEmail({
    to: usuario.email,
    subject: template.subject,
    html: template.html
  });
  
  // Registrar en base de datos
  await crearNotificacion({
    usuario_id: destinatarioId,
    tipo,
    titulo: template.subject,
    mensaje: template.text,
    enviada_email: true,
    fecha_envio_email: new Date()
  });
});
```

**Templates de Email:**

```javascript
// templates/email/oferta-confirmada.hbs
const templates = {
  OFERTA_CONFIRMADA: {
    subject: (data) => `Oferta confirmada - ${data.obra_nombre}`,
    html: (data) => `
      <h1>¡Oferta registrada!</h1>
      <p>Tu oferta de <strong>$${data.monto}</strong> por <strong>${data.obra_nombre}</strong> fue registrada exitosamente.</p>
      <p>Precio actual: $${data.precio_actual}</p>
      <a href="${data.link_obra}">Ver obra</a>
    `
  },
  
  OFERTA_SUPERADA: {
    subject: (data) => `Te superaron en ${data.obra_nombre}`,
    html: (data) => `
      <h1>¡Alguien te superó!</h1>
      <p>Tu oferta de <strong>$${data.tu_oferta}</strong> fue superada.</p>
      <p>Nueva oferta: <strong>$${data.nueva_oferta}</strong></p>
      <p>Para recuperar tu posición, ofrece al menos <strong>$${data.monto_minimo}</strong></p>
      <a href="${data.link_obra}">Hacer nueva oferta</a>
    `
  },
  
  GANASTE_SUBASTA: {
    subject: (data) => `¡Ganaste ${data.obra_nombre}!`,
    html: (data) => `
      <h1>¡Felicidades!</h1>
      <p>Ganaste la subasta de <strong>${data.obra_nombre}</strong> por <strong>$${data.monto}</strong>.</p>
      <p>Por favor procede con el pago antes del ${data.fecha_limite}.</p>
      <a href="${data.link_pago}">Pagar ahora</a>
    `
  }
};
```

---

### 8.8 Monitoreo y Logging

**Estructura de Logs:**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'subasta-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log de ofertas
logger.info('Oferta creada', {
  oferta_id: oferta.id,
  obra_id: obra.id,
  usuario_id: usuario.id,
  monto: oferta.monto,
  precio_anterior: obra.precio_actual,
  extension_aplicada: false,
  timestamp: new Date()
});

// Log de errores
logger.error('Error al procesar pago', {
  pago_id: pago.id,
  error: err.message,
  stack: err.stack,
  timestamp: new Date()
});
```

**Métricas a Monitorear:**

- Número de usuarios activos
- Número de ofertas por minuto
- Tiempo de respuesta promedio
- Tasa de error en ofertas
- Tasa de éxito en pagos
- Número de extensiones por obra
- Tasa de conversión (ofertas → pagos)

---

## 9. EXCLUSIONES EXPLÍCITAS DEL MVP

Las siguientes funcionalidades **NO están incluidas** en el MVP y no deben implementarse en esta fase:

### 9.1 Funcionalidades de Usuario

❌ **No incluir:**
- Sistema de chat entre postores
- Sistema de chat con administradores
- Comentarios en obras
- Sistema de favoritos/wishlist
- Sistema de reputación de usuarios
- Verificación de identidad avanzada (KYC)
- Historial de valuaciones de obras
- Recomendaciones personalizadas
- Notificaciones push móviles
- Sistema de referidos
- Programa de puntos o lealtad

### 9.2 Funcionalidades de Subasta

❌ **No incluir:**
- Subastas con puja ciega (sealed bid)
- Subastas inversas
- Subastas holandesas
- Subastas de múltiples artículos
- Pujas automáticas (proxy bidding)
- Ofertas pre-autorizadas
- Grupos de compra
- Opción de "Make an Offer" fuera de subasta
- Subasta de "Buy it now" sin precio base
- Reserva mínima oculta

### 9.3 Funcionalidades Administrativas

❌ **No incluir:**
- Gestión de múltiples eventos simultáneos
- Sistema de roles granular (solo USER y ADMIN)
- Subadministradores con permisos específicos
- Workflow de aprobación de obras
- Sistema de categorías/taxonomías complejas
- Gestión de artistas como entidad separada
- Sistema de comisiones configurables
- Integración con CRM
- Reportes avanzados con filtros complejos
- Analítica predictiva
- A/B testing de configuraciones

### 9.4 Funcionalidades de Pago

❌ **No incluir:**
- Múltiples monedas
- Conversión de divisas en tiempo real
- Pagos en cuotas
- Financiamiento
- Wallet interno
- Criptomonedas
- Facturación automática
- Integración con sistemas contables
- Split payments (múltiples beneficiarios)
- Reembolsos automatizados

### 9.5 Funcionalidades de Contenido

❌ **No incluir:**
- Multi-idioma (i18n)
- Traducciones automáticas
- Videos de obras
- Tours 360° o realidad aumentada
- Certificados digitales (NFT)
- Metadata EXIF de imágenes
- Watermarking automático
- Galería en modo presentación
- Historias o posts tipo redes sociales

### 9.6 Funcionalidades de Marketing

❌ **No incluir:**
- Publicación automática en redes sociales
- Integración con Facebook/Instagram Ads
- Email marketing avanzado (Mailchimp, etc.)
- Sistema de cupones/descuentos
- Landing pages personalizables
- Pixel de seguimiento de conversiones
- Retargeting
- Integración con Google Analytics avanzada

### 9.7 Funcionalidades Técnicas Avanzadas

❌ **No incluir:**
- API pública para terceros
- Webhooks configurables
- Búsqueda con filtros complejos
- Elasticsearch o búsqueda semántica
- Machine learning para predicción de precios
- Recomendación basada en IA
- Detección de fraude automatizada
- Sistema de caché distribuida complejo
- Microservicios
- GraphQL API

### 9.8 Integraciones Externas

❌ **No incluir:**
- Integración con redes sociales para login (excepto Google)
- Integración con calendarios (Google Calendar, etc.)
- SMS notifications
- WhatsApp notifications
- Integración con sistemas de envío
- Integración con proveedores de seguros
- Integración con sistemas de valuación de arte

### 9.9 Funcionalidades Móviles

❌ **No incluir:**
- Aplicación móvil nativa (iOS/Android)
- Progressive Web App (PWA) avanzada
- Notificaciones push móviles
- Escaneo de QR para obras
- Geolocalización

### 9.10 Otras Exclusiones

❌ **No incluir:**
- Sistema de tickets/soporte
- FAQ dinámicas
- Blog o sección de noticias
- Términos y condiciones multipágina
- Aceptación de términos por secciones
- Sistema de encuestas
- Sistema de reviews/calificaciones
- Sección de prensa
- Página de equipo
- Modo oscuro/claro
- Accesibilidad avanzada (WCAG AAA)
- Temas personalizables

---

## RESUMEN Y PRÓXIMOS PASOS

Este documento define la arquitectura completa del MVP de la plataforma de subasta silenciosa.

**Lo que SÍ incluye el MVP:**
✅ Registro con Google OAuth
✅ Visualización de evento y galería
✅ Sistema de ofertas con incremento mínimo
✅ Cierre dinámico con extensión automática
✅ Opción "Cómpralo ahora"
✅ Notificaciones por email
✅ Múltiples métodos de pago
✅ Panel administrativo completo
✅ Dashboard en tiempo real
✅ Gestión de pagos y entregas
✅ Exportación de reportes

**Principios del MVP:**
1. Funcionalidad core completa y robusta
2. Código simple y mantenible
3. Separación clara de responsabilidades
4. Sin features innecesarias
5. Enfoque en estabilidad y seguridad

**Recomendación de Implementación:**

**Fase 1 (Semana 1-2):**
- Setup de proyecto
- Modelo de datos
- Autenticación básica
- CRUD de obras

**Fase 2 (Semana 3-4):**
- Sistema de ofertas
- Lógica de cierre dinámico
- WebSocket/polling
- Notificaciones por email

**Fase 3 (Semana 5-6):**
- Sistema de pagos
- Panel administrativo
- Dashboard
- Testing

**Fase 4 (Semana 7-8):**
- Refinamiento de UI
- Testing de integración
- Corrección de bugs
- Preparación para producción

Este MVP puede estar **completamente funcional en 8 semanas** con un equipo de 2-3 desarrolladores.
