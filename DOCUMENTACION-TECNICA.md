# 📚 Documentación Técnica - Sistema de Reportes QA v3.1

> Documentación consolidada del sistema automatizado de reportes QA desde Notion API

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tipos de Reportes](#tipos-de-reportes)
4. [Uso y Comandos](#uso-y-comandos)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Changelog](#changelog)

---

## 🎯 Introducción

Sistema automatizado que extrae datos de casos de prueba (CP) e incidencias (RI) desde bases de datos de Notion, procesa la información y genera reportes estructurados en formato JSON.

### Características Principales v3.1

- **2 Tipos de Reportes**: Diario (cambios) y Semanal (métricas)
- **Ordenamiento Inteligente**: Por ID numérico (CP-7 antes de CP-10)
- **Estructura Simplificada**: JSON limpio y fácil de procesar
- **Timezone Configurable**: America/Asuncion por defecto
- **Rate Limiting**: Manejo inteligente de API de Notion
- **Manejo Robusto de Errores**: Continúa procesando aunque falle un proyecto

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
src/
├── domain/               # Lógica de negocio y tipos
│   ├── tipos-reportes-simple.ts    # Tipos para reportes v3.1
│   ├── types.ts                    # Tipos generales
│   ├── utils-notion.ts             # Utilidades de Notion
│   └── ...
├── notion/               # Integración con Notion API
│   ├── client.ts         # Cliente seguro de Notion
│   └── fetch.ts          # Fetcher con rate limiting
├── report/               # Generadores de reportes
│   ├── json-generator-daily-simple.ts    # Reporte diario v3.1
│   ├── json-generator-weekly-simple.ts   # Reporte semanal v3.1
│   └── json-generator-real.ts            # Generador legacy v2.0
└── index.ts              # CLI principal
```

### Flujo de Datos

```
[Notion API]
    ↓
[NotionFetcher]
    ↓
[Procesamiento]
    ↓
[Generador de Reportes]
    ↓
[Archivo JSON]
```

---

## 📊 Tipos de Reportes

### 1. Reporte Diario Simplificado

**Archivo**: `reports/latest-daily.json`

**Estructura**:
```json
{
  "fecha": "2025-11-13",
  "zona_horaria": "America/Asuncion",
  "proyectos": [
    {
      "nombre": "Proyecto X",
      "matriz_pruebas": {
        "total_actual": 45,
        "cambios": [
          {
            "id": "01",
            "titulo": "CP-01 - Descripción",
            "estado_actual": "Finalizado",
            "estado_anterior": ""
          }
        ]
      },
      "incidencias": {
        "total_actual": 15,
        "cambios": [...]
      }
    }
  ]
}
```

**Características**:
- ✅ Solo items con estado actual
- ✅ Ordenados por ID numérico (01, 02, 03... 10, 11...)
- ✅ Campo `estado_anterior` vacío en v1 (sin comparación)
- ✅ Total actual de items por proyecto

### 2. Reporte Semanal Simplificado

**Archivo**: `reports/semanales/latest-weekly.json`

**Estructura**:
```json
{
  "semana": "2025-W46",
  "fecha_generacion": "2025-11-13",
  "zona_horaria": "America/Asuncion",
  "proyectos": [
    {
      "nombre": "Proyecto X",
      "casos_agregados_semana": 45,
      "incidencias_devueltas_semana": 11,
      "casos_prueba_finalizados_semana": 20,
      "casos_prueba_pendientes": 31
    }
  ]
}
```

**Características**:
- ✅ Solo 4 métricas clave
- ✅ Sin comparación con semana anterior
- ✅ Formato de semana ISO 8601 (YYYY-WNN)
- ✅ Métricas basadas en estado actual

**Métricas Explicadas**:
- `casos_agregados_semana`: Total de CPs encontrados (v1: aproximación)
- `incidencias_devueltas_semana`: RIs con estado "Devuelto"
- `casos_prueba_finalizados_semana`: CPs con estado "Finalizado"
- `casos_prueba_pendientes`: CPs con estado "Pendiente"

---

## 🚀 Uso y Comandos

### Instalación

```powershell
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### Configuración

**Archivo `.env`**:
```env
NOTION_TOKEN=secret_xxx
NOTION_PROJECTS_DB_ID=160a972d1d9d800b9d9fdc19f16e1126
TIMEZONE=America/Asuncion
```

### Comandos Principales

#### Generar Reporte Diario
```powershell
npm run generate:daily
```
- Genera `reports/reporte-daily-YYYY-MM-DD.json`
- Crea copia en `reports/latest-daily.json`

#### Generar Reporte Semanal
```powershell
npm run generate:weekly
```
- Genera `reports/semanales/reporte-weekly-YYYY-WNN.json`
- Crea copia en `reports/semanales/latest-weekly.json`

#### Validar Configuración
```powershell
npm run validate
```

#### Opciones Adicionales
```powershell
# Sin validación de token (más rápido)
node dist/index.js generate:daily --skip-validation
node dist/index.js generate:weekly --skip-validation
```

---

## 📁 Estructura de Archivos

### Carpetas de Salida

```
reports/
├── reporte-daily-2025-11-13.json
├── latest-daily.json
└── semanales/
    ├── reporte-weekly-2025-W46.json
    └── latest-weekly.json
```

### Archivos Legacy (v2.0)

```
reportes/
├── reporte-real-2025-11-10.json
└── reporte-real-2025-11-12.json
```

---

## 📝 Changelog

### v3.1.0 - 2025-11-13

**Cambios Principales**:
- ✨ Nuevos generadores simplificados (daily + weekly)
- 🔧 CLI actualizado con comandos `generate:daily` y `generate:weekly`
- 📊 Estructura JSON simplificada sin buckets complejos
- 🔢 Ordenamiento por ID numérico corregido
- 📚 Documentación consolidada en un solo archivo

**Archivos Nuevos**:
- `src/domain/tipos-reportes-simple.ts`
- `src/report/json-generator-daily-simple.ts`
- `src/report/json-generator-weekly-simple.ts`
- `DOCUMENTACION-TECNICA.md` (este archivo)

**Archivos Modificados**:
- `src/index.ts` - Agregados nuevos comandos CLI
- `package.json` - Versión 3.1.0, nuevos scripts

**Mejoras**:
- Reporte diario con solo cambios ordenados por ID
- Reporte semanal con solo 4 métricas clave
- Sin comparaciones complejas (v1 simplificado)
- Documentación consolidada

### v2.0.0 - 2025-11-10

**Cambios Principales**:
- Generador de reportes JSON con buckets por estado
- Sistema de extracción desde Notion API
- Rate limiting y manejo de errores
- Soporte para múltiples proyectos

---

## 🔮 Roadmap (v3.2)

### Sistema de Snapshots y Comparación

**Objetivo**: Detectar cambios reales comparando con el día anterior

**Implementación Planificada**:
1. Sistema de snapshots diarios en `snapshots/YYYY/MM/DD/`
2. Comparación inteligente con snapshot de ayer
3. Campo `estado_anterior` con valor real (no vacío)
4. Detección de:
   - Items nuevos
   - Cambios de estado
   - Items eliminados

**Estructura de Snapshot**:
```json
{
  "fecha": "2025-11-13",
  "proyectos": [
    {
      "nombre": "Proyecto X",
      "casos": [
        {"id": "01", "titulo": "...", "estado": "Finalizado"}
      ],
      "incidencias": [...]
    }
  ]
}
```

**Beneficios**:
- Reporte diario mostrará solo cambios REALES
- Métricas semanales precisas (casos agregados esta semana vs total)
- Histórico de estados para análisis

---

## 💡 Notas Técnicas

### Extracción de ID

El sistema extrae el número del CP o RI usando regex:
```typescript
const match = titulo.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
// Ejemplos:
// "CP-01" → "1"
// "CP - 7" → "7"
// "RI-10" → "10"
```

### Ordenamiento Numérico

Los IDs se ordenan numéricamente (no alfabéticamente):
```typescript
// Correcto (numérico):
CP-1, CP-2, CP-7, CP-10, CP-11

// Incorrecto (alfabético):
CP-1, CP-10, CP-11, CP-2, CP-7
```

### Manejo de Errores

El sistema continúa procesando aunque un proyecto falle:
```typescript
try {
  const reporte = await this.procesarProyecto(proyecto);
  proyectosReporte.push(reporte);
} catch (error) {
  console.error(`[ERROR] ${proyecto.name}`);
  proyectosReporte.push(this.crearReporteVacio(proyecto.name));
}
```

---

## 🛠️ Desarrollo

### Compilar
```powershell
npm run build
```

### Linting
```powershell
npm run lint
npm run lint:fix
```

### Formateo
```powershell
npm run format
npm run format:check
```

---

## 📞 Soporte

Para consultas técnicas o reportar issues:
- **Autor**: Lucas Zaracho
- **Repositorio**: ReporteQA
- **Versión**: 3.1.0

---

*Última actualización: 13 de noviembre de 2025*
