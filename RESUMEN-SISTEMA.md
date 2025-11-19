# 📊 RESUMEN EJECUTIVO DEL SISTEMA - ReporteQA

**Versión:** 3.2.0  
**Última Actualización:** 18 de Noviembre 2025  
**Tecnologías:** TypeScript 5.3.3 + Node.js 22.12.0 + Notion API 2.2.15

---

## 🎯 ¿QUÉ HACE EL SISTEMA?

Sistema automatizado que extrae datos de **Casos de Prueba (CP)** e **Incidencias (RI)** desde bases de datos de Notion y genera reportes comparativos diarios y semanales con detección automática de cambios.

---

## 📁 ESTRUCTURA DEL PROYECTO

```
ReporteQA/
├── src/                           # Código fuente TypeScript
│   ├── index.ts                   # CLI principal con comandos
│   ├── config.ts                  # Configuración centralizada
│   │
│   ├── notion/                    # Integración con Notion API
│   │   ├── client.ts              # Cliente seguro con validación de token
│   │   └── fetch.ts               # Fetcher robusto con rate limiting y reintentos
│   │
│   ├── domain/                    # Lógica de negocio
│   │   ├── diff-engine-v2.ts      # Motor de comparación de snapshots
│   │   ├── snapshot.ts            # Gestor de snapshots (DiffManager)
│   │   ├── snapshot-manager.ts    # Manager de archivos de snapshot
│   │   ├── types.ts               # Tipos base del sistema
│   │   ├── tipos-reportes-simple.ts  # Tipos para reportes v3.1
│   │   └── utils.ts               # Utilidades (fechas, normalizaciones)
│   │
│   ├── report/                    # Generadores de reportes
│   │   ├── json-generator-daily-simple.ts   # Reporte diario con cambios
│   │   └── json-generator-weekly-simple.ts  # Reporte semanal con métricas
│   │
│   └── storage/                   # Persistencia de datos
│       └── fs.ts                  # Gestor de archivos locales
│
├── snapshots/                     # Snapshots guardados por fecha
│   ├── snapshot-2025-11-17.json
│   ├── snapshot-2025-11-18.json
│   └── latest.json
│
├── reports/                       # Reportes generados (organizados por fecha)
│   ├── latest-daily.json          # Último reporte diario (acceso rápido)
│   ├── latest-weekly.json         # Último reporte semanal (acceso rápido)
│   └── 2025/
│       └── 11/
│           └── 18/
│               ├── reporte-daily-2025-11-18.json
│               └── semanales/
│                   └── reporte-weekly-2025-W47.json
│
├── tests/                         # Suite de pruebas automatizadas
│   ├── global-setup.ts            # Configuración de entorno de test
│   └── test-v3.2-funcionalidades.spec.ts  # 12 tests (100% passing)
│
├── Scripts de Utilidad/
│   ├── fix-git.ps1                # Reparación automática de errores Git
│   ├── setup-git.ps1              # Configuración preventiva de Git
│   └── ver-cambios.ps1            # Visualización de cambios con colores
│
└── Configuración/
    ├── package.json               # Dependencias y scripts npm
    ├── tsconfig.json              # Configuración TypeScript (strict mode)
    ├── playwright.config.ts       # Configuración de tests
    ├── .env                       # Variables de entorno (token, DB IDs)
    └── token.txt                  # Token de Notion (desarrollo local)
```

---

## 🔧 COMPONENTES PRINCIPALES

### 1. **Sistema de Snapshots** 📸
**Archivo:** `src/domain/snapshot.ts` + `snapshot-manager.ts`

**¿Qué hace?**
- Guarda el estado completo de todos los proyectos cada día
- Permite comparaciones precisas entre diferentes fechas
- Almacena: ID, título, estado de cada item (CP/RI)

**Funciones clave:**
- `guardarSnapshot()` - Guarda estado actual
- `buscarSnapshotDiaHabilAnterior()` - Busca snapshot del día hábil anterior
- `buscarSnapshotDiasHabilesAtras(n)` - Busca snapshot de hace N días hábiles

**Formato de snapshot:**
```json
{
  "fecha_hora": "2025-11-18 11:15:44",
  "zona_horaria": "America/Asuncion",
  "proyectos": [{
    "nombre_proyecto": "CRM Celexx",
    "matriz_pruebas": [
      {"id": "23", "titulo": "CP-23 - ...", "estado": "Finalizado"}
    ],
    "incidencias": [
      {"id": "5", "titulo": "RI-5 - ...", "estado": "Resuelto"}
    ]
  }]
}
```

---

### 2. **Motor de Comparación (Diff Engine)** 🔍
**Archivo:** `src/domain/diff-engine-v2.ts`

**¿Qué hace?**
- Compara dos snapshots (ayer vs hoy)
- Detecta items nuevos, modificados y eliminados
- Clasifica cambios por tipo

**Detecciones:**
- ✅ **Items Nuevos**: ID no existe en snapshot anterior
- ✅ **Items Modificados**: ID existe pero cambió estado
- ✅ **Items Eliminados**: ID existía pero ya no está

**Método principal:**
```typescript
compararProyecto(actual: Snapshot, anterior: Snapshot | null)
```

**Retorna:**
```typescript
{
  matriz: {
    items_nuevos: [...],
    items_con_cambio_estado: [...],
    items_eliminados: [...]
  },
  incidencias: {
    items_nuevos: [...],
    items_con_cambio_estado: [...],
    items_eliminados: [...]
  }
}
```

---

### 3. **Integración con Notion API** 🔌
**Archivos:** `src/notion/client.ts` + `fetch.ts`

**Características:**
- ✅ **Rate Limiting**: Respeta límites de Notion (3 req/s)
- ✅ **Reintentos Automáticos**: Hasta 3 intentos con backoff exponencial
- ✅ **Manejo de Errores**: Errores recuperables vs no recuperables
- ✅ **Token Seguro**: Validación antes de operar

**Funciones principales:**
```typescript
// Obtener proyectos activos
fetchActiveProjects(dbId)

// Obtener páginas hijo (Documento Técnico QA)
fetchChildPages(projectId)

// Obtener items de una DB
fetchDatabaseItems(dbId, filters)

// Validar token
validateToken()
```

**Filtros aplicados:**
- Solo proyectos con estado "En curso"
- Solo DBs dentro de "Documento técnico QA"
- Nombres específicos: "Matriz de pruebas", "Reporte de incidencias"

---

### 4. **Generador de Reportes Diarios** 📅
**Archivo:** `src/report/json-generator-daily-simple.ts`

**¿Qué hace?**
1. Carga snapshot del día hábil anterior
2. Extrae datos actuales desde Notion
3. Compara con snapshot anterior
4. Detecta cambios y clasifica por tipo
5. Guarda nuevo snapshot
6. Genera reporte con cambios

**Comando:**
```bash
npm run generate:daily
```

**Salida:**
- `reports/YYYY/MM/DD/reporte-daily-YYYY-MM-DD.json`
- `reports/latest-daily.json` (copia rápida)
- `snapshots/snapshot-YYYY-MM-DD.json`

**Estructura del reporte:**
```json
{
  "fecha_hora": "2025-11-18 11:15:44",
  "zona_horaria": "America/Asuncion",
  "proyectos": [{
    "nombre": "CRM Celexx",
    "matriz_pruebas": {
      "total_actual": 79,
      "por_estado": {
        "Finalizado": 45,
        "En curso": 20,
        "Pendiente": 14
      },
      "cambios": [
        {
          "id": "23",
          "titulo": "CP-23 - Crear Oportunidad",
          "estado_actual": "Finalizado",
          "estado_anterior": "En curso",
          "tipo_cambio": "modificado"  ← CLASIFICACIÓN
        }
      ]
    },
    "incidencias": {
      "total_actual": 124,
      "por_estado": {...},
      "cambios": [...]
    }
  }]
}
```

**Tipos de cambio detectados:**
- `"nuevo"` - Item no existía antes
- `"modificado"` - Item cambió de estado
- `"eliminado"` - Item fue eliminado

---

### 5. **Generador de Reportes Semanales** 📊
**Archivo:** `src/report/json-generator-weekly-simple.ts`

**¿Qué hace?**
- Compara estado actual con snapshot de hace 5 días hábiles (1 semana laboral)
- Calcula 4 métricas clave por proyecto

**Comando:**
```bash
npm run generate:weekly
```

**Salida:**
- `reports/YYYY/MM/DD/semanales/reporte-weekly-YYYY-W##.json`
- `reports/latest-weekly.json`

**Métricas calculadas:**
```json
{
  "semana": "2025-W47",
  "fecha_hora": "2025-11-18 11:15:44",
  "proyectos": [{
    "nombre": "CRM Celexx",
    "casos_agregados_semana": 12,           // CPs nuevos
    "incidencias_devueltas_semana": 5,      // RIs devueltas
    "incidencias_resueltas_semana": 8,      // RIs resueltas
    "casos_prueba_finalizados_semana": 15,  // CPs finalizados
    "casos_prueba_pendientes": 14           // CPs pendientes actuales
  }]
}
```

---

### 6. **Utilidades de Fecha** 📆
**Archivo:** `src/domain/utils.ts`

**Funciones:**
- `obtenerFechaHoraActual()` - Fecha/hora en timezone configurado
- `obtenerDiaHabilAnterior(fecha)` - Retrocede saltando fines de semana
- `obtenerFechaDiasHabilesAtras(n, desde)` - N días hábiles atrás
- `esDiaHabil(fecha)` - Valida si es Lunes-Viernes
- `formatearFecha(fecha)` - Formato YYYY-MM-DD

**Configuración:**
- Timezone: `America/Asuncion` (GMT-4)
- Días hábiles: Lunes a Viernes
- Formato de semana: ISO 8601 (YYYY-W##)

---

### 7. **CLI (Command Line Interface)** 💻
**Archivo:** `src/index.ts`

**Comandos disponibles:**

```bash
# Generar reporte diario
npm run generate:daily
node dist/index.js generate:daily

# Generar reporte semanal  
npm run generate:weekly
node dist/index.js generate:weekly

# Validar configuración y token
node dist/index.js validate
```

**Flujo de ejecución:**
1. Validar token de Notion
2. Verificar variables de entorno
3. Ejecutar generador correspondiente
4. Mostrar resumen en consola
5. Guardar archivos

---

### 8. **Sistema de Tests** ✅
**Archivo:** `tests/test-v3.2-funcionalidades.spec.ts`

**12 Tests Automatizados:**

**Date Utils (4 tests):**
- ✅ Obtener fecha/hora con timezone
- ✅ Identificar días hábiles
- ✅ Calcular día hábil anterior
- ✅ Calcular 5 días hábiles atrás

**Snapshot Manager (2 tests):**
- ✅ Inicialización correcta
- ✅ Manejo de snapshots inexistentes

**Diff Engine (5 tests):**
- ✅ Detectar items nuevos
- ✅ Detectar cambios de estado
- ✅ Detectar items eliminados
- ✅ Calcular métricas semanales
- ✅ Comparar proyectos completos

**Integración (1 test):**
- ✅ Verificar sistema completo integrado

**Ejecutar tests:**
```bash
npm test
npx playwright test
```

---

## 🚀 FLUJO DE TRABAJO TÍPICO

### **Uso Diario (Cada Mañana):**

```bash
# 1. Generar reporte del día
npm run generate:daily

# 2. Ver cambios con colores
.\ver-cambios.ps1

# 3. Revisar JSON detallado (si es necesario)
code reports\latest-daily.json
```

**Resultado:**
- ✅ Reporte de lo que cambió desde ayer
- ✅ Clasificación: nuevos/modificados/eliminados
- ✅ Estado anterior → estado actual
- ✅ Snapshot guardado automáticamente

---

### **Uso Semanal (Cada Viernes):**

```bash
# Generar reporte de la semana
npm run generate:weekly

# Revisar métricas
code reports\latest-weekly.json
```

**Resultado:**
- ✅ Métricas de la semana completa
- ✅ 4 indicadores clave por proyecto
- ✅ Comparación con hace 5 días hábiles

---

## 🔒 SEGURIDAD Y CONFIGURACIÓN

### **Variables de Entorno (.env):**
```env
# Notion API
NOTION_TOKEN=secret_xxx                    # Token de integración
NOTION_PROJECTS_DB_ID=160a972d...         # ID de DB de proyectos

# Configuración
TIMEZONE=America/Asuncion                  # Zona horaria
NODE_ENV=production                        # Entorno

# Directorios (opcionales)
SNAPSHOT_DIR=./snapshots
REPORT_OUT_DIR=./reports
```

### **Archivos Sensibles (NO subir a Git):**
- ❌ `token.txt` - Token de Notion
- ❌ `.env` - Variables de entorno
- ❌ `reports/*.json` - Reportes generados
- ❌ `snapshots/*.json` - Snapshots

**Incluidos en `.gitignore`**

---

## 🛠️ SCRIPTS DE UTILIDAD

### **1. fix-git.ps1** 🔧
**Problema que resuelve:**  
Error `cannot open '.git/FETCH_HEAD'` que obligaba a eliminar y volver a clonar

**Uso:**
```powershell
.\fix-git.ps1
```

**Hace:**
- ✅ Verifica archivos Git críticos
- ✅ Crea archivos faltantes (FETCH_HEAD, ORIG_HEAD)
- ✅ Repara índice corrupto
- ✅ Limpia referencias rotas
- ✅ Sincroniza con remoto

---

### **2. setup-git.ps1** 🛡️
**Prevención de problemas Git**

**Uso:**
```powershell
.\setup-git.ps1
```

**Hace:**
- ✅ Configura hooks automáticos
- ✅ Aplica configuraciones de estabilidad
- ✅ Previene futuros errores de FETCH_HEAD

---

### **3. ver-cambios.ps1** 👁️
**Visualización mejorada de cambios**

**Uso:**
```powershell
.\ver-cambios.ps1
```

**Muestra:**
- ✅ Resumen global con colores
- ✅ Estadísticas por proyecto
- ✅ Clasificación visual: [+] [~] [-]
- ✅ Estado anterior → estado actual
- ✅ Top 5 cambios por proyecto

---

## 📊 EJEMPLO DE SALIDA

### **Consola (Reporte Diario):**
```
>> Generando reporte diario con comparaciones...
   Fecha/Hora: 2025-11-18 11:15:44
   Snapshot encontrado: 2025-11-17
   Snapshot anterior encontrado: 2025-11-17 14:40:27
   Consultando proyectos activos desde Notion...
   Proyectos activos: 7

   Procesando CRM Celexx...
      -> 16 cambios detectados
   
   Procesando Flujos JBPM...
      -> 2 cambios detectados
   
   Snapshot guardado: snapshots\snapshot-2025-11-18.json
   Reporte guardado: reports\2025\11\18\reporte-daily-2025-11-18.json

>> REPORTE DIARIO COMPLETADO
   Fecha/Hora: 2025-11-18 11:15:44
   Proyectos: 7
   Total items: 18
```

---

### **Script ver-cambios.ps1:**
```
========================================================
         REPORTE DIARIO DE CAMBIOS - QA
========================================================

Fecha/Hora: 2025-11-18 11:15:44
Proyectos Analizados: 7

========================================================
                    RESUMEN GLOBAL
========================================================

Proyectos con cambios: 2 de 7

[+] Items Nuevos:      0
[~] Items Modificados: 18
[-] Items Eliminados:  0

Total de cambios:     18

========================================================
                DETALLES POR PROYECTO
========================================================

--------------------------------------------------------
PROYECTO: CRM Celexx
--------------------------------------------------------

Estado:
  Casos de Prueba: 79 total - 16 cambios
  Incidencias: 124 total - 0 cambios

Clasificacion de Cambios:
  [+] Nuevos: 0   [~] Modificados: 16   [-] Eliminados: 0

Cambios en Matriz de Pruebas:
  [~] ID: 23 - CP-23 - Crear Oportunidad
     En curso -> Finalizado
  [~] ID: 25 - CP-25 - Editar Oportunidad
     Pendiente -> Finalizado
  ...
```

---

## 🔄 ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO                           │
│        (npm run generate:daily/weekly)              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                  CLI (index.ts)                     │
│  • Validar token                                    │
│  • Parsear comandos                                 │
│  • Orquestar flujo                                  │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Notion API   │    │ Snapshot Manager │
│  Client      │    │  • Cargar        │
│  • Fetch     │    │  • Guardar       │
│  • Validate  │    │  • Buscar        │
└──────┬───────┘    └─────────┬────────┘
       │                      │
       ▼                      ▼
┌─────────────────────────────────────┐
│      JSON Generator (Daily)         │
│  1. Cargar snapshot anterior        │
│  2. Fetch datos actuales            │
│  3. Comparar con DiffEngine         │
│  4. Clasificar cambios              │
│  5. Generar reporte                 │
│  6. Guardar snapshot nuevo          │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   Reports/   │    │  Snapshots/  │
│  JSON Files  │    │  JSON Files  │
└──────────────┘    └──────────────┘
```

---

## 📈 CAPACIDADES DEL SISTEMA

### **Lo que SÍ hace:**
✅ Extrae datos de proyectos "En curso" desde Notion  
✅ Guarda snapshots diarios automáticamente  
✅ Compara estado actual vs anterior  
✅ Detecta cambios: nuevos/modificados/eliminados  
✅ Genera reportes diarios con cambios  
✅ Genera reportes semanales con métricas  
✅ Organiza reportes por fecha (YYYY/MM/DD)  
✅ Maneja errores sin detener el proceso  
✅ Respeta rate limits de Notion  
✅ Ordena items por ID numérico  
✅ Soporta múltiples proyectos simultáneos  
✅ Tests automatizados (12/12 passing)  

### **Lo que NO hace:**
❌ No genera reportes en otros formatos (PDF, Excel)  
❌ No envía reportes por email automáticamente  
❌ No tiene interfaz gráfica (solo CLI)  
❌ No modifica datos en Notion (solo lectura)  
❌ No soporta múltiples workspaces de Notion  
❌ No hace análisis predictivo o ML  
❌ No integra con otras herramientas (Jira, etc)  

---

## 🎓 GUÍAS RÁPIDAS

### **Primera vez usando el sistema:**
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar token
# Crear archivo token.txt con tu token de Notion

# 3. Configurar .env
# Copiar .env.example a .env y completar

# 4. Configurar Git (una sola vez)
.\setup-git.ps1

# 5. Validar configuración
node dist/index.js validate

# 6. Generar primer reporte
npm run generate:daily
```

---

### **Uso diario:**
```bash
# Opción 1: Rápido
npm run generate:daily && .\ver-cambios.ps1

# Opción 2: Paso a paso
npm run generate:daily        # Generar
.\ver-cambios.ps1             # Ver resumen
code reports\latest-daily.json # Ver detalle
```

---

### **Solucionar problemas:**
```bash
# Error de Git FETCH_HEAD
.\fix-git.ps1

# Verificar tests
npm test

# Limpiar y recompilar
npm run clean
npm run build
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **`README.md`** - Inicio rápido y características
- **`GIT-TROUBLESHOOTING.md`** - Solución de problemas Git
- **`INSTRUCCIONES-PARA-COLABORADORES.md`** - Guía para el equipo
- **`LEER-SI-HAY-ERROR-GIT.txt`** - Aviso visual de error Git

---

## 🔮 PRÓXIMAS MEJORAS POSIBLES

### **Versión 3.3 (Futuro):**
- 📧 Envío automático de reportes por email
- 📊 Gráficos y visualizaciones
- 🔔 Notificaciones cuando hay cambios críticos
- 📄 Exportar a PDF/Excel
- 🌐 Dashboard web interactivo
- 📱 Integración con Slack/Teams
- 🔍 Búsqueda avanzada de cambios históricos
- 📈 Tendencias y análisis de productividad

---

## 👥 COLABORADORES

Para agregar nuevos colaboradores:

1. Compartir acceso al repositorio Git
2. Proporcionarles un token de Notion
3. Indicarles ejecutar `.\setup-git.ps1`
4. Compartir este resumen

**Si encuentran error de Git:**
```bash
.\fix-git.ps1
```

---

## 🏆 RESUMEN EJECUTIVO DE UNA LÍNEA

**"Sistema automatizado que detecta y clasifica cambios diarios en casos de prueba e incidencias de Notion, generando reportes comparativos con snapshots históricos y organización por fecha."**

---

**Sistema completamente funcional, testeado y listo para producción** ✅

_Generado: 18 de Noviembre 2025_
