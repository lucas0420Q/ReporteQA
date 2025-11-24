# Changelog - ReporteQA

Todos los cambios notables del proyecto se documentan en este archivo.

---

## [3.2.1] - 2025-11-20 - Refactorización y Limpieza

### 🧹 Limpieza y Simplificación

#### Documentación Consolidada
- ✅ **README.md renovado**: Documentación completa y clara en un solo archivo
- ❌ Eliminados archivos redundantes:
  - `GUIA-EMAIL.md` (contenido integrado en README)
  - `IMPLEMENTACION-EMAIL.md` (contenido integrado en README)
  - `INSTRUCCIONES-PARA-COLABORADORES.md` (contenido simplificado)
  - `CAMBIOS-V3.2.md` (reemplazado por este CHANGELOG)
  - `INSTRUCCIONES-EMAIL.txt` (obsoleto)
  - `LEER-SI-HAY-ERROR-GIT.txt` (obsoleto)
- ✅ Mantenidos:
  - `README.md` (principal)
  - `GIT-TROUBLESHOOTING.md` (solución de problemas Git)

#### Scripts y Archivos de Prueba
- ❌ Eliminados scripts obsoletos de `/scripts`:
  - `test-email-ethereal.ts`
  - `test-email-real.ts`
  - `test-email-verify.ts`
- ❌ Eliminados archivos HTML/EML de prueba:
  - `test-email-diario.html`
  - `test-email-semanal.html`
  - `email-test-reporte-diario.eml`

#### Package.json Optimizado
- ❌ Eliminados scripts innecesarios:
  - `dev` (tsx main.ts)
  - `generate` (redundante)
  - `reporte`, `reporte:json`, `reporte:limpio` (obsoletos)
  - `test:email-*` (scripts de prueba manual)
- ✅ Mantenidos scripts esenciales:
  - `build`, `start`
  - `generate:daily`, `generate:weekly`
  - `send:daily-email`, `send:weekly-email`
  - `test:email-connection`
  - `start:scheduler`, `status:scheduler`
  - `test`, `test:ui`
  - `lint`, `format`, `clean`

### 📖 Mejoras en Documentación

#### README.md
- ✅ Estructura clara y lógica
- ✅ Sección "Inicio Rápido" mejorada
- ✅ Guía completa de configuración de email (Gmail/Outlook)
- ✅ Ejemplos de estructura de reportes (JSON)
- ✅ Tabla de comandos disponibles
- ✅ Solución de problemas común
- ✅ Referencia completa de variables de entorno
- ✅ Badges actualizados (TypeScript 5.3, Node.js 22+)

#### .env.example
- ✅ Comentarios mejorados y organizados por sección
- ✅ Notas de configuración específicas por proveedor
- ✅ Instrucciones claras para Gmail (App Password)

### 🧪 Tests
- ✅ **33/33 tests pasando** correctamente
- ✅ Cobertura completa del sistema de email:
  - Generación de plantillas HTML (daily/weekly)
  - Validación de configuración
  - Escape de HTML (prevención XSS)
  - Truncamiento de cambios
  - Badges de tipo de cambio
- ✅ Tests de funcionalidades v3.2:
  - Date utils (días hábiles)
  - Snapshot manager
  - Diff engine
  - Integración completa

### 🏗️ Estructura del Proyecto

Después de la refactorización, el proyecto mantiene una estructura limpia y bien organizada:

```
ReporteQA/
├── src/
│   ├── config/
│   │   └── email-config.ts
│   ├── domain/
│   │   ├── tipos-reportes-simple.ts
│   │   ├── constants.ts
│   │   └── [otros archivos de dominio]
│   ├── email/
│   │   ├── email-service.ts
│   │   ├── email-templates.ts
│   │   └── email-orchestrator.ts
│   ├── notion/
│   ├── report/
│   ├── scheduler/
│   └── utils/
├── tests/
│   └── [archivos de test]
├── .env.example
├── README.md
├── GIT-TROUBLESHOOTING.md
├── CHANGELOG.md
├── package.json
└── tsconfig.json
```

### 📊 Estadísticas de Limpieza

- **Archivos eliminados**: 9 archivos innecesarios
- **Documentación consolidada**: 6 → 2 archivos .md
- **Scripts limpiados**: 10 scripts obsoletos removidos
- **Código compilado**: ✅ Sin errores
- **Tests**: ✅ 33/33 pasando

---

## [3.2.0] - 2025-11-19

### ✨ Nuevas Características

- 📧 Sistema completo de envío de emails HTML
- ⏰ Scheduler automático con node-cron
- 🔄 Reintentos automáticos con backoff exponencial
- 🎨 Templates HTML profesionales con tablas
- 📝 Sistema de logging detallado
- 🧪 Tests unitarios para email

### 🔧 Comandos Nuevos

- `npm run send:daily-email`
- `npm run send:weekly-email`
- `npm run test:email-connection`
- `npm run start:scheduler`
- `npm run status:scheduler`

---

## [3.1.0] - 2025-11-13

### ✨ Nuevas Características

- Generadores simplificados (daily + weekly)
- CLI con comandos dedicados
- JSON simplificado sin buckets complejos
- Ordenamiento numérico por ID corregido
- Clasificación de cambios (nuevo/modificado/eliminado)

---

## [2.0.0] - 2025-11-10

### ✨ Nuevas Características

- Integración con Notion API
- Sistema de snapshots para comparación
- Soporte para múltiples proyectos
- Rate limiting optimizado
- Manejo robusto de errores

---

## [1.0.0] - 2025-11-01

### 🎉 Release Inicial

- Extracción básica de datos de Notion
- Generación de reportes JSON
- Soporte para casos de prueba e incidencias
