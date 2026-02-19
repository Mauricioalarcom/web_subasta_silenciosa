# 📚 Índice de Documentación

Guía rápida para navegar por toda la documentación del proyecto.

---

## 🎨 Documentación Principal

### [README.md](README.md) - 🏠 Página Principal
**Propósito:** Visión general del proyecto, inicio rápido, tecnologías y roadmap  
**Cuándo usar:** Primera vez que accedes al proyecto o para tener una visión general  
**Contenido:**
- Instalación rápida
- Stack tecnológico
- URLs de acceso
- Roadmap completo
- Troubleshooting básico

---

### [INSTALL.md](INSTALL.md) - 📦 Guía de Instalación Completa
**Propósito:** Instrucciones detalladas de instalación paso a paso  
**Cuándo usar:** Si es tu primera instalación o tienes problemas durante el setup  
**Contenido:**
- Requisitos previos
- Instalación automática y manual
- Configuración de PostgreSQL
- Configuración de variables de entorno
- Solución de problemas común
- Verificación de instalación

---

### [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md) - 🏗️ Especificaciones Técnicas
**Propósito:** Documentación técnica completa del MVP  
**Cuándo usar:** Para entender la arquitectura, esquema DB, endpoints API y requerimientos  
**Contenido:**
- Arquitectura del sistema
- Esquema de base de datos
- Endpoints de API
- Modelos de datos
- Flujos de negocio
- Especificaciones de cada checkpoint

---

### [CHECKPOINT_1_COMPLETADO.md](CHECKPOINT_1_COMPLETADO.md) - ✅ Estado del Checkpoint 1
**Propósito:** Resumen detallado de lo implementado en el Checkpoint 1  
**Cuándo usar:** Para ver qué se completó y qué viene después  
**Contenido:**
- Archivos creados
- Funcionalidades implementadas
- Endpoints disponibles
- Credenciales de prueba
- Pasos de verificación
- Próximos checkpoints

---

### [STATUS.md](STATUS.md) - 📊 Estado Actual del Proyecto
**Propósito:** Vista rápida del progreso y métricas del proyecto  
**Cuándo usar:** Para ver el estado general y progreso del MVP  
**Contenido:**
- Progreso visual (%)
- Funcionalidades completadas
- Próximo checkpoint
- Métricas del proyecto
- Bugs conocidos

---

### [COMANDOS.md](COMANDOS.md) - ⚡ Cheat Sheet de Comandos
**Propósito:** Referencia rápida de comandos para desarrollo diario  
**Cuándo usar:** Como referencia cuando necesitas ejecutar comandos comunes  
**Contenido:**
- Comandos de instalación
- Comandos de ejecución
- Comandos de base de datos
- Comandos de troubleshooting
- Consultas SQL útiles
- Git workflow

---

## 🚀 Scripts de Automatización

### [install.sh](install.sh) - 📦 Instalación Automática
**Propósito:** Instalar todas las dependencias del proyecto automáticamente  
**Uso:**
```bash
./install.sh
```
**Acciones:**
- Verifica Node.js
- Instala dependencias del backend
- Instala dependencias del admin-panel
- Crea archivo .env desde .env.example
- Muestra próximos pasos

---

### [start.sh](start.sh) - ▶️ Script de Inicio (Verificación)
**Propósito:** Verificar que todo esté configurado antes de iniciar  
**Uso:**
```bash
./start.sh
```
**Acciones:**
- Verifica PostgreSQL
- Verifica dependencias
- Verifica archivo .env
- Muestra instrucciones para iniciar servidores

---

### [start-dev.sh](start-dev.sh) - 🚀 Inicio de Servidores en Paralelo
**Propósito:** Iniciar backend y frontend simultáneamente  
**Uso:**
```bash
./start-dev.sh
```
**Acciones:**
- Verifica configuración completa
- Inicia backend en puerto 4000
- Inicia admin-panel en puerto 3001
- Maneja Ctrl+C para detener ambos
- Genera logs en backend.log y frontend.log

---

### [stop.sh](stop.sh) - 🛑 Detener Servidores
**Propósito:** Detener todos los procesos corriendo en los puertos del proyecto  
**Uso:**
```bash
./stop.sh
```
**Acciones:**
- Busca procesos en puerto 4000 (backend)
- Busca procesos en puerto 3001 (admin)
- Busca procesos en puerto 3000 (web pública)
- Termina todos los procesos encontrados

---

## 📖 Guías de Uso Recomendadas

### Para Nuevos Desarrolladores

```
1. Lee: README.md (visión general)
2. Sigue: INSTALL.md (instalación paso a paso)
3. Ejecuta: ./install.sh
4. Lee: CHECKPOINT_1_COMPLETADO.md (entender lo que ya existe)
5. Referencia: COMANDOS.md (comandos diarios)
```

### Para Desarrollo Diario

```
1. Inicia: ./start-dev.sh
2. Desarrolla tus cambios
3. Consulta: COMANDOS.md (cuando necesites comandos)
4. Verifica: STATUS.md (ver progreso)
5. Detén: Ctrl+C o ./stop.sh
```

### Para Entender la Arquitectura

```
1. Lee: ARQUITECTURA_MVP.md (sección 1-3)
2. Revisa: Esquema de base de datos
3. Explora: Endpoints de API
4. Consulta: Especificaciones de checkpoints
```

### Para Resolver Problemas

```
1. Busca tu error en: README.md - Troubleshooting
2. Si no resuelves: INSTALL.md - Solución de Problemas
3. Verifica configuración: COMANDOS.md - Troubleshooting
4. Consulta logs: tail -f backend.log o frontend.log
```

---

## 📂 Estructura del Proyecto

```
web_silenciosa/
├── 📄 README.md                    [Inicio - Lee esto primero]
├── 📄 INSTALL.md                   [Guía de instalación detallada]
├── 📄 ARQUITECTURA_MVP.md          [Specs técnicas completas]
├── 📄 CHECKPOINT_1_COMPLETADO.md   [Resumen del Checkpoint 1]
├── 📄 STATUS.md                    [Estado actual del proyecto]
├── 📄 COMANDOS.md                  [Cheat sheet de comandos]
├── 📄 DOCS.md                      [Este archivo]
│
├── 🚀 install.sh                   [Script de instalación]
├── 🚀 start.sh                     [Script de verificación]
├── 🚀 start-dev.sh                 [Iniciar servidores]
├── 🚀 stop.sh                      [Detener servidores]
│
├── 📂 backend/                     [API Backend]
│   ├── src/
│   ├── package.json
│   └── .env.example
│
└── 📂 admin-panel/                 [Panel Admin]
    ├── src/
    ├── package.json
    └── .env.local
```

---

## 🔍 Búsqueda Rápida

**"¿Cómo instalo el proyecto?"**  
→ [INSTALL.md](INSTALL.md)

**"¿Cómo inicio los servidores?"**  
→ [start-dev.sh](start-dev.sh) o [COMANDOS.md](COMANDOS.md)

**"¿Qué tecnologías se usan?"**  
→ [README.md](README.md#-arquitectura) o [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md)

**"¿Cuál es el progreso del proyecto?"**  
→ [STATUS.md](STATUS.md)

**"¿Qué falta por hacer?"**  
→ [README.md](README.md#-roadmap-de-desarrollo)

**"¿Cómo funciona la base de datos?"**  
→ [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md#3-modelo-de-datos)

**"¿Qué endpoints hay disponibles?"**  
→ [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md#4-endpoints-de-api) o [CHECKPOINT_1_COMPLETADO.md](CHECKPOINT_1_COMPLETADO.md#endpoints-implementados)

**"Tengo un error, ¿dónde busco?"**  
→ [INSTALL.md](INSTALL.md#-solución-de-problemas) o [README.md](README.md#-troubleshooting)

**"¿Qué comandos puedo usar?"**  
→ [COMANDOS.md](COMANDOS.md)

---

## 🎯 Flujos de Trabajo Comunes

### Flujo 1: Primera Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd web_silenciosa

# 2. Leer documentación inicial
open README.md
open INSTALL.md

# 3. Ejecutar instalación automática
./install.sh

# 4. Configurar variables de entorno
nano backend/.env  # Editar con tus credenciales

# 5. Crear base de datos
createdb subasta_silenciosa

# 6. Ejecutar migraciones
cd backend
npm run db:migrate
npm run db:seed

# 7. Iniciar aplicación
cd ..
./start-dev.sh
```

### Flujo 2: Desarrollo Diario

```bash
# 1. Iniciar servidores
./start-dev.sh

# 2. Desarrollar cambios
# (editar código)

# 3. Ver cambios en tiempo real
# Backend: http://localhost:4000
# Frontend: http://localhost:3001

# 4. Detener cuando termines
Ctrl+C  # o ./stop.sh en otra terminal

# 5. Commit cambios
git add .
git commit -m "feat: descripción"
git push
```

### Flujo 3: Debugging

```bash
# 1. Ver logs en tiempo real
tail -f backend.log
tail -f frontend.log

# 2. Verificar errores en el código
cd admin-panel
npm run type-check
npm run lint

# 3. Probar endpoints manualmente
curl http://localhost:4000/health

# 4. Revisar base de datos
psql -U postgres -d subasta_silenciosa
SELECT * FROM usuarios;

# 5. Reiniciar si es necesario
./stop.sh
./start-dev.sh
```

---

## 📊 Resumen de Documentos

| Documento | Tamaño | Propósito | Audiencia |
|-----------|--------|-----------|-----------|
| README.md | Grande | Visión general | Todos |
| INSTALL.md | Grande | Instalación detallada | Nuevos devs |
| ARQUITECTURA_MVP.md | Muy grande | Especificaciones | Desarrolladores |
| CHECKPOINT_1_COMPLETADO.md | Mediano | Resumen de progreso | Todos |
| STATUS.md | Pequeño | Estado rápido | Todos |
| COMANDOS.md | Grande | Referencia rápida | Desarrolladores |
| DOCS.md | Mediano | Índice de docs | Todos |

---

## 🆘 ¿Perdido?

Si no sabes por dónde empezar:

1. **Lee primero:** [README.md](README.md)
2. **Instala siguiendo:** [INSTALL.md](INSTALL.md)
3. **Consulta comandos en:** [COMANDOS.md](COMANDOS.md)
4. **Entiende la arquitectura:** [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md)
5. **Ve el progreso:** [STATUS.md](STATUS.md)

---

## 💡 Consejos

- **Mantén siempre actualizado** el [STATUS.md](STATUS.md) después de cada checkpoint
- **Documenta nuevos endpoints** en [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md)
- **Actualiza [COMANDOS.md](COMANDOS.md)** si agregas nuevos scripts
- **Lee los logs** cuando algo falle: `tail -f backend.log frontend.log`
- **Usa los scripts** en lugar de comandos manuales: `./start-dev.sh` vs `cd backend && npm run dev`

---

<div align="center">

**[⬆ Volver arriba](#-índice-de-documentación)**

Actualizado: Febrero 2026

</div>
