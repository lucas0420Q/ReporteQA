# 📊 Sistema de Reportes QA v3.1

> Sistema automatizado de reportes QA con extracción desde Notion API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Notion API](https://img.shields.io/badge/Notion%20API-2.2.15-black)](https://developers.notion.com/)

## 🎯 ¿Qué hace este proyecto?

Extrae automáticamente datos de **casos de prueba (CP)** e **incidencias (RI)** desde tus bases de datos de Notion y genera reportes estructurados en formato JSON.

### ✨ Características v3.1

- 📊 **2 Tipos de Reportes**: Diario (cambios) + Semanal (métricas)
- 🔢 **Ordenamiento por ID**: Numérico (CP-7 antes de CP-10)
- 🏷️ **Clasificación de Cambios**: Detecta items nuevos, modificados y eliminados
- 📈 **Reporte Semanal**: Solo 4 métricas clave, sin comparaciones
- 📝 **Reporte Diario**: Estado actual + comparación con día anterior
- 📸 **Sistema de Snapshots**: Guarda estado diario para comparaciones precisas
- 🌎 **Timezone Configurable**: America/Asuncion por defecto
- 🛡️ **Manejo Robusto**: Continúa aunque falle un proyecto
- ⚡ **Rate Limiting**: Optimización de llamadas a API

## 🚀 Inicio Rápido

### 1️⃣ Instalación

```powershell
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### 2️⃣ Configuración

Crear archivo `.env` con:
```env
NOTION_TOKEN=secret_xxx
NOTION_PROJECTS_DB_ID=tu_database_id
TIMEZONE=America/Asuncion
```

Verificar configuración:
```powershell
npm run validate
```

### 3️⃣ Uso

**Generar Reporte Diario** (cambios con clasificación):
```powershell
npm run generate:daily
```
→ Genera `reports/YYYY/MM/DD/reporte-daily-YYYY-MM-DD.json`

**Ver cambios con colores**:
```powershell
.\ver-cambios.ps1
```
→ Muestra resumen visual con clasificación: [+] Nuevos, [~] Modificados, [-] Eliminados

**Generar Reporte Semanal** (4 métricas clave):
```powershell
npm run generate:weekly
```
→ Genera `reports/YYYY/MM/DD/semanales/reporte-weekly-YYYY-W##.json`

## 📊 Estructura de Reportes

### Reporte Diario
```json
{
  "fecha_hora": "2025-11-18 11:15:44",
  "proyectos": [{
    "nombre": "CRM Celexx",
    "matriz_pruebas": {
      "total_actual": 79,
      "por_estado": {"Finalizado": 40, "En curso": 25, "Pendiente": 14},
      "cambios": [
        {
          "id": "23",
          "titulo": "CP - 23 - Crear Oportunidad",
          "estado_actual": "Finalizado",
          "estado_anterior": "En curso",
          "tipo_cambio": "modificado"
        }
      ]
    },
    "incidencias": {
      "total_actual": 124,
      "cambios": []
    }
  }]
}
```

### Reporte Semanal
```json
{
  "semana": "2025-W46",
  "proyectos": [{
    "nombre": "Proyecto X",
    "casos_agregados_semana": 45,
    "incidencias_devueltas_semana": 11,
    "casos_prueba_finalizados_semana": 20,
    "casos_prueba_pendientes": 31
  }]
}
```

## 📁 Estructura del Proyecto

```
src/
├── domain/               # Tipos y lógica de negocio
│   └── tipos-reportes-simple.ts  # Tipos v3.1
├── notion/               # Integración Notion API
│   ├── client.ts         # Cliente seguro
│   └── fetch.ts          # Fetcher con rate limiting
├── report/               # Generadores de reportes
│   ├── json-generator-daily-simple.ts   # Reporte diario
│   └── json-generator-weekly-simple.ts  # Reporte semanal
└── index.ts              # CLI principal

reports/                  # Reportes generados
├── latest-daily.json
└── semanales/
    └── latest-weekly.json
```

## 🔧 Comandos Disponibles

```powershell
# Generar reportes
npm run generate:daily        # Reporte diario
npm run generate:weekly       # Reporte semanal

# Utilidades
npm run validate             # Validar configuración
npm run build                # Compilar TypeScript
npm run lint                 # Linter
npm run format               # Formatear código
```

## 📚 Documentación

Para documentación completa, ver **[DOCUMENTACION-TECNICA.md](./DOCUMENTACION-TECNICA.md)**

Incluye:
- Arquitectura del sistema
- Estructuras de datos detalladas
- Roadmap (v3.2 con sistema de snapshots)
- Notas técnicas

## 🔮 Próximas Mejoras (v3.2)

- Sistema de snapshots diarios para comparación real
- Campo `estado_anterior` con valor real (no vacío)
- Detección de items nuevos, modificados y eliminados
- Métricas semanales precisas basadas en diffs

## 📝 Changelog

### v3.1.0 - 2025-11-13
- ✨ Nuevos generadores simplificados (daily + weekly)
- 🔧 CLI con comandos `generate:daily` y `generate:weekly`
- 📊 JSON simplificado sin buckets complejos
- 🔢 Ordenamiento numérico por ID corregido
- 📚 Documentación consolidada

### v2.0.0 - 2025-11-10
- Generador JSON con buckets por estado
- Rate limiting y manejo de errores
- Soporte múltiples proyectos

## 👤 Autor

**Lucas Zaracho**  
Sistema de Reportes QA - v3.1.0

---

*Para más detalles, consulta la [documentación técnica completa](./DOCUMENTACION-TECNICA.md)*

1. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

2. **Configurar el Token de Notion (3 opciones):**

**Opción A: Archivo token.txt (Recomendado para desarrollo)**
```bash
# Copia y renombra el archivo ejemplo
cp token.example.txt token.txt
# Edita token.txt con tu token real de Notion
```

**Opción B: Variable de entorno**
```bash
NOTION_TOKEN=ntn_tu_token_aquí
```

**Opción C: AWS Secrets Manager (Producción)**
```bash
AWS_SECRETS_NAME=nombre-del-secret
AWS_REGION=us-east-1
```

3. **Variables requeridas en `.env`:**
```bash
NOTION_PROJECTS_DB_ID=tu_database_id
MATRIZ_DB_NAME=Matriz de Pruebas
INCIDENCIAS_DB_NAME=Reporte de incidencias
```

### 3️⃣ Uso

**Generar reporte completo:**
```bash
npm run reporte
# Genera JSON + TXT para gerencia
```

**Solo datos JSON:**
```bash
npm run reporte:json
```

**Versión limpia (sin logs):**
```bash
npm run reporte:limpio
```

## 📊 ¿Qué genera?

### 📄 Archivos JSON
- **Datos técnicos completos** con toda la información extraída
- **Formato estructurado** para integración con otros sistemas

### 📋 Archivos TXT para Gerencia
```
📁 reportes-gerencia/reporte-YYYY-MM-DD/
├── 📄 00-RESUMEN-EJECUTIVO.txt    # 👔 Para presentar al gerente
├── 📄 01-DETALLE-PROYECTOS.txt    # 📊 Vista general de todos
└── 📁 proyectos-individuales/     # 🔍 Detalle por proyecto
    ├── 📄 Crux_-_Version_20.txt
    ├── 📄 CRM_Celexx.txt
    └── 📄 ...
```

### 📈 Ejemplo de Salida
```
🎯 REPORTE GENERADO EXITOSAMENTE
═══════════════════════════════════
📅 Fecha: 2025-11-10
📊 Proyectos: 7
🧪 Casos de Prueba: 166
🐛 Incidencias: 157
📄 Archivo JSON: reportes/reporte-real-2025-11-10.json
📁 Archivos TXT: reportes-gerencia/reporte-2025-11-10
```

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run reporte` | 🎯 Generar reporte completo (recomendado) |
| `npm run reporte:json` | 📄 Solo generar datos JSON |
| `npm run reporte:limpio` | 🧹 Reporte sin logs detallados |
| `npm run build` | 🔨 Compilar TypeScript |
| `npm run lint` | 🔍 Verificar código |
| `npm run clean` | 🗑️ Limpiar archivos temporales |

## 🔧 Configuración Avanzada

### Variables de Entorno Opcionales

```bash
# Directorios personalizados
SNAPSHOT_DIR=./snapshots
REPORT_OUT_DIR=./reportes

# Rate limiting
NOTION_RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Logging
LOG_LEVEL=info
ENABLE_DEBUG=false
```

### AWS (Opcional)

Para usar AWS Secrets Manager en lugar de `.env`:

```bash
AWS_REGION=us-east-1
AWS_SECRETS_NAME=notion-qa-secrets
```

## 🔒 Seguridad del Token

### ⚠️ IMPORTANTE: El token de Notion es SENSIBLE
- **NUNCA** subir el archivo `token.txt` al repositorio
- **NUNCA** hacer commit del token hardcodeado
- **SIEMPRE** usar `.gitignore` para excluir archivos de token

### 📂 Estructura Recomendada para el Repositorio
```
📁 Proyecto-QA/
├── 📄 token.example.txt   ✅ SÍ subir (ejemplo)
├── 📄 token.txt          ❌ NO subir (contiene token real)
├── 📄 .gitignore         ✅ SÍ subir (incluye token.txt)
└── 📄 README.md          ✅ SÍ subir (instrucciones)
```

### 🔧 Orden de Prioridad para el Token
1. **AWS Secrets Manager** (producción)
2. **Archivo token.txt** (desarrollo local)
3. **Variable de entorno** (fallback)

## 🚨 Solución de Problemas

### 🔧 Error: "cannot open '.git/FETCH_HEAD'"

**Síntoma:** Tu jefe (u otros colaboradores) ven este error al hacer pull y tienen que eliminar y volver a clonar el repositorio.

**Solución Rápida (Recomendada):**
```powershell
# Ejecutar script de reparación automática
.\fix-git.ps1
```

Este script soluciona el problema en segundos sin necesidad de eliminar nada.

**Solución Manual:**
```powershell
# Crear el archivo faltante
New-Item -Path ".git\FETCH_HEAD" -ItemType File -Force

# Limpiar y reparar
git gc --prune=now
git fetch origin
```

**Prevención:**
```powershell
# Configurar hooks automáticos (ejecutar una sola vez)
.\setup-git.ps1
```

📖 **Ver guía completa:** [GIT-TROUBLESHOOTING.md](./GIT-TROUBLESHOOTING.md)

---

### Error: "multiple data sources"
Si ves este error, significa que una base de datos de Notion usa múltiples fuentes:

1. Abrir la base de datos en Notion
2. Ir a configuración (3 puntos)
3. Remover fuentes adicionales
4. Ejecutar nuevamente

### Error: Token no válido
```bash
# Verificar que el token es correcto
echo $NOTION_TOKEN

# Debe empezar con 'ntn_' o 'secret_'
```

### Sin datos encontrados
- Verificar que la integración tiene acceso a las páginas
- Confirmar que los nombres de DB coinciden exactamente

## 📚 Arquitectura

### Componentes Principales

- **`main.ts`**: Punto de entrada y orquestación
- **`NotionFetcher`**: Extracción robusta de datos
- **`JSONGeneratorReal`**: Procesamiento de datos
- **`GeneradorTxtParaGerente`**: Formateo gerencial

### Flujo de Datos

```
Notion API → Extracción → Procesamiento → Reportes
     ↓           ↓            ↓           ↓
  [Proyectos] [Matrices] [Estadísticas] [TXT+JSON]
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📄 Licencia

MIT - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

¿Problemas? [Crear issue](../../issues) o contactar al equipo de desarrollo.

---

**Hecho con ❤️ para optimizar reportes de QA**