# 📚 Documentación Completa - Sistema de Reportes QA

> **Sistema automatizado de reportes QA desde Notion API**  
> Versión 3.2.0 | Noviembre 2025

---

## 📋 Índice

### Para Usuarios QA / Negocio
1. [¿Qué hace este sistema?](#qué-hace-este-sistema)
2. [Tipos de reportes](#tipos-de-reportes)
3. [Explicación de contadores](#explicación-de-contadores)
4. [Dónde encontrar reportes](#dónde-encontrar-reportes)

### Para Desarrolladores / DevOps
5. [Instalación y configuración](#instalación-y-configuración)
6. [Arquitectura del sistema](#arquitectura-del-sistema)
7. [Scripts disponibles](#scripts-disponibles)
8. [Variables de entorno](#variables-de-entorno)
9. [Integración con tareas programadas](#integración-con-tareas-programadas)
10. [Troubleshooting](#troubleshooting)

---

# 👥 SECCIÓN PARA USUARIOS QA / NEGOCIO

## ¿Qué hace este sistema?

El **Sistema de Reportes QA** automatiza la extracción y análisis de información de testing desde Notion:

- 📊 **Extrae** datos de Casos de Prueba (CP) e Incidencias (RI)
- 🔄 **Compara** con días/semanas anteriores para detectar cambios
- 📈 **Genera** reportes JSON y CSV con métricas clave
- 📅 **Mantiene** histórico completo sin sobreescritura

### Información que procesa

#### 🧪 Casos de Prueba (CP)
Tests diseñados para validar funcionalidades. Estados:
- **Pendiente**: No iniciado
- **En curso**: En ejecución
- **Finalizado**: Completado

#### 🐛 Incidencias (RI)
Bugs encontrados durante testing. Estados:
- **Pendiente**: Reportado, sin asignar
- **Devuelto**: Devuelto a desarrollo
- **En curso**: En corrección
- **Finalizado**: Corrección implementada
- **Resuelto**: Verificado y cerrado

---

## Tipos de reportes

### 📅 Reporte Diario

**¿Qué muestra?**
- Cambios del día vs día hábil anterior
- Items nuevos agregados hoy
- Items que cambiaron de estado
- Contadores actuales por estado

**Formato:** JSON  
**Ubicación:** `./reports/diarios/reporte-diario-YYYY-MM-DD.json`

**Ejemplo de uso:**
> "¿Qué casos y bugs se agregaron o modificaron hoy?"

---

### 📊 Reporte Semanal

**¿Qué muestra?**

**4 métricas clave de la semana:**
- **CP_nuevos**: Casos agregados esta semana
- **CP_con_cambios**: Casos que cambiaron de estado
- **RI_nuevas**: Incidencias reportadas esta semana
- **RI_con_cambios**: Incidencias que cambiaron de estado

**Totales actuales por estado** (para ver estado general del proyecto)

**Formatos:** JSON y CSV  
**Ubicación:** `./reports/semanales/`

---

### 📊 Exportación CSV

Reporte semanal en formato Excel-compatible con **dos tablas**:

**Tabla 1: Casos de Prueba (CP)**
```
Proyecto    | CP_nuevos | CP_con_cambios | CP_pendientes | CP_en_curso | CP_finalizados
Proyecto A  |    15     |       8        |      25       |     12      |      63
```

**Tabla 2: Incidencias (RI)**
```
Proyecto    | RI_nuevas | RI_con_cambios | RI_pendientes | RI_en_curso | RI_devuelto | RI_finalizado | RI_resuelto
Proyecto A  |    12     |       7        |       8       |      5      |      3      |      45       |     38
```

**Delimitador**: Punto y coma (`;`) para Excel en español

---

## Explicación de contadores

### 📈 Contadores de Casos de Prueba (CP)

| Contador | Significado |
|----------|-------------|
| **CP_nuevos** | Casos **agregados** en el período |
| **CP_con_cambios** | Casos que **cambiaron de estado** en el período |
| **CP_pendientes** | Total de casos "Pendiente" **actuales** |
| **CP_en_curso** | Total de casos "En curso" **actuales** |
| **CP_finalizados** | Total de casos "Finalizado" **actuales** |

### 🐛 Contadores de Incidencias (RI)

| Contador | Significado |
|----------|-------------|
| **RI_nuevas** | Incidencias **reportadas** en el período |
| **RI_con_cambios** | Incidencias que **cambiaron de estado** en el período |
| **RI_pendientes** | Total "Pendiente" **actuales** |
| **RI_en_curso** | Total "En curso" **actuales** |
| **RI_devuelto** | Total "Devuelto" **actuales** |
| **RI_finalizado** | Total "Finalizado" **actuales** |
| **RI_resuelto** | Total "Resuelto" **actuales** |

### 📌 Diferencia importante

**Cambios del período** (`_nuevos`, `_con_cambios`):
- Actividad en el período analizado
- Se calculan comparando con snapshot anterior

**Totales actuales** (`_pendientes`, `_en_curso`, etc.):
- Estado actual de todos los items
- Totales acumulados desde siempre

**Ejemplo:**
```
CP_nuevos: 5         → Se agregaron 5 casos esta semana
CP_con_cambios: 12   → 12 casos cambiaron esta semana  
CP_finalizados: 87   → Hay 87 casos finalizados en total
```

---

## Dónde encontrar reportes

```
reports/
├── latest-daily.json          # ← Último diario (acceso rápido)
├── latest-weekly.json         # ← Último semanal (acceso rápido)
│
├── diarios/
│   ├── reporte-diario-2025-11-21.json
│   ├── reporte-diario-2025-11-22.json
│   └── ...
│
└── semanales/
    ├── reporte-semanal-2025-11-21-160504.json
    └── csv/
        ├── reporte-semanal-2025-11-21.csv
        └── ...
```

**Archivos "latest"**: Siempre apuntan al último reporte generado

---

### ⏰ Frecuencia recomendada

| Reporte | Frecuencia | Mejor momento |
|---------|-----------|---------------|
| Diario | Lunes a Viernes | 9:00 AM |
| Semanal | Lunes | 8:00 AM |
| CSV | Lunes | Después del semanal JSON |

**Nota**: El sistema trabaja con días hábiles (L-V). Si se ejecuta un lunes, compara con el viernes anterior.

---

### ⚠️ Limitaciones conocidas

1. **Solo proyectos "En Curso"**: Se ignoran proyectos pausados/finalizados
2. **Estructura requerida**: Cada proyecto debe tener página "Documento técnico QA"
3. **Primera ejecución**: No habrá comparación (no existe snapshot anterior)
4. **DBs múltiples fuentes**: Notion API no las soporta, consolidar en una fuente

---

# 🔧 SECCIÓN PARA DESARROLLADORES / DEVOPS

## Instalación y configuración

### Requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Token de Notion** con permisos de lectura

### Instalación

```bash
# 1. Clonar repositorio
git clone <url-repositorio>
cd ReporteQA

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build
```

### Configuración

Crear `.env` en la raíz:

```env
# Obligatorio
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PROJECTS_DB_ID=160a972d1d9d800b9d9fdc19f16e1126
MATRIZ_DB_NAME=Matriz de Pruebas
INCIDENCIAS_DB_NAME=Reporte de Incidencias

# Opcional
SNAPSHOT_DIR=./snapshots
REPORT_OUT_DIR=./reports
RATE_LIMIT_RPM=60
LOG_LEVEL=info
ENABLE_DEBUG=false
```

**Alternativa**: Crear archivo `token.txt` en la raíz con el token de Notion

### Validar configuración

```bash
npm run validate
```

Salida esperada:
```
>> Validando configuración...
   Configuración válida
   Workspace: <workspace-id>
   Bot ID: <bot-id>
```

---

## Arquitectura del sistema

### Flujo de datos

```
Notion API
    ↓
NotionFetcher (obtiene proyectos y datos)
    ↓
Transformación (normalización, validación)
    ↓
SnapshotManager (guarda estado actual)
    ↓
DiffEngine (compara con snapshot anterior)
    ↓
Generadores de Reportes (JSON/CSV)
    ↓
FileSystem (escritura atómica, histórico)
```

### Estructura del código

```
src/
├── types/              # Tipos TypeScript centralizados
│   ├── common.ts       # Tipos compartidos
│   ├── notion.ts       # Interfaces Notion API
│   ├── errors.ts       # Jerarquía de errores
│   └── report-types.ts # Tipos de reportes
│
├── utils/              # Utilidades reutilizables
│   ├── common.ts       # Funciones comunes
│   ├── logger.ts       # Sistema de logging
│   └── fs-reports.ts   # Manejo de archivos
│
├── notion/             # Integración Notion API
│   ├── client.ts       # Cliente Notion
│   └── fetch.ts        # Obtención de datos
│
├── domain/             # Lógica de negocio
│   ├── date-utils.ts
│   ├── snapshot-manager.ts
│   ├── diff-engine-v2.ts
│   └── utils-notion.ts
│
├── report/             # Generadores de reportes
│   ├── json-generator-real.ts
│   ├── json-generator-daily-simple.ts
│   ├── json-generator-weekly-simple.ts
│   └── csv-exporter-weekly.ts
│
├── config/             # Configuraciones
│   └── csv-config.ts
│
└── storage/            # Almacenamiento
    ├── fs.ts
    └── s3.ts
```

### Módulos clave

#### NotionFetcher
- Consultas paginadas
- Rate limiting (60 req/min)
- Manejo de errores (429, 401, 404)
- Retry automático

#### SnapshotManager
- Guarda estado completo en JSON
- Busca último día hábil
- Permite comparaciones precisas

#### DiffEngine
- Compara snapshots
- Detecta: nuevos, modificados, eliminados
- Calcula métricas semanales

#### Generadores
- **Daily**: Solo cambios del día
- **Weekly**: Métricas de la semana
- **CSV**: Exportación Excel-compatible

---

## Scripts disponibles

### Generación de reportes

```bash
# Reporte diario (cambios del día)
npm run generate:daily

# Reporte semanal (métricas de la semana)
npm run generate:weekly

# Exportar último semanal a CSV
npm run export:weekly-csv

# Exportar JSON específico a CSV
npm run export:weekly-csv-custom -- --json ./path/report.json
```

### Listado de reportes

```bash
# Listar reportes diarios
npm run list:daily

# Listar reportes semanales
npm run list:weekly
```

### Build y validación

```bash
npm run build          # Compilar TypeScript
npm run validate       # Validar configuración
npm test               # Ejecutar tests
npm run lint           # Verificar código
npm run lint:fix       # Auto-corregir problemas
```

---

## Variables de entorno

### Obligatorias

| Variable | Descripción |
|----------|-------------|
| `NOTION_TOKEN` | Token de integración Notion |
| `NOTION_PROJECTS_DB_ID` | ID de DB de proyectos |
| `MATRIZ_DB_NAME` | Nombre de DB de matriz |
| `INCIDENCIAS_DB_NAME` | Nombre de DB de incidencias |

### Opcionales

| Variable | Default | Descripción |
|----------|---------|-------------|
| `SNAPSHOT_DIR` | `./snapshots` | Directorio snapshots |
| `REPORT_OUT_DIR` | `./reports` | Directorio reportes |
| `RATE_LIMIT_RPM` | `60` | Requests/min a Notion |
| `LOG_LEVEL` | `info` | Nivel de log |
| `ENABLE_DEBUG` | `false` | Logs debug |

---

## Integración con tareas programadas

### Windows (Task Scheduler)

1. Abrir **Task Scheduler**
2. Crear tarea básica
3. Trigger: Diario 9:00 AM (L-V)
4. Acción:
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `C:\path\ReporteQA\dist\index.js generate:daily`
   - Iniciar en: `C:\path\ReporteQA`

### Linux/macOS (cron)

```bash
crontab -e
```

Agregar:
```cron
# Diario: L-V 9:00 AM
0 9 * * 1-5 cd /path/ReporteQA && node dist/index.js generate:daily >> logs/daily.log 2>&1

# Semanal: Lunes 8:00 AM
0 8 * * 1 cd /path/ReporteQA && node dist/index.js generate:weekly >> logs/weekly.log 2>&1

# CSV: Lunes 8:05 AM
5 8 * * 1 cd /path/ReporteQA && node dist/index.js export:weekly-csv >> logs/csv.log 2>&1
```

---

## Troubleshooting

### Error: "NOTION_TOKEN no encontrado"

**Causa**: Token no configurado  
**Solución**: Verificar `.env` o `token.txt`, ejecutar `npm run validate`

### Error: "Rate limit excedido"

**Causa**: Demasiadas requests a Notion  
**Solución**: Reducir `RATE_LIMIT_RPM` en `.env`, ejecutar en horario de baja actividad

### CSV con campos en cero

**Causa**: Primera ejecución sin snapshot anterior  
**Solución**: Normal la primera vez. Siguiente ejecución tendrá valores correctos.

### Error: "Multiple data sources"

**Causa**: DB Notion con fuentes múltiples  
**Solución**: Consolidar a una única fuente en Notion

### No se detectan cambios

**Verificar**:
1. Existe snapshot anterior: `ls snapshots/`
2. Cambios posteriores al último snapshot
3. Estados correctos en Notion

---

## Agregar nuevos proyectos

### En Notion

1. Crear proyecto en DB principal
2. Estado = "En Curso"
3. Crear página "Documento técnico QA"
4. Agregar DBs: "Matriz" e "Incidencias"
5. Dar permisos a integración

### En el sistema

No requiere configuración. El sistema detecta automáticamente proyectos "En Curso".

---

## Manejo de errores

Jerarquía de errores tipados:

```typescript
BaseQAError
├── NotionAPIError      // Errores de API
├── ConfigurationError  // Configuración inválida
├── ValidationError     // Datos inválidos
└── ProcessingError     // Errores de procesamiento
```

Todos incluyen:
- Stack trace completo
- Contexto del error
- No interrumpen otros proyectos

---

## Stack tecnológico

- **Runtime**: Node.js >= 18.0.0
- **Lenguaje**: TypeScript 5.3+
- **API**: Notion SDK
- **Validación**: Zod
- **Testing**: Playwright
- **Linting**: ESLint + Prettier

---

## 📞 Soporte

- **Repositorio**: ReporteQA en GitHub
- **Issues**: GitHub issue tracker
- **Equipo**: DevOps / QA Engineering

---

**Versión**: 3.2.0  
**Última actualización**: Noviembre 2025  
**Licencia**: MIT
