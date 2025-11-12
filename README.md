# 📊 Generador de Reportes QA v2.0

> Sistema automatizado para generar reportes gerenciales de QA desde Notion API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Notion API](https://img.shields.io/badge/Notion%20API-2.2.15-black)](https://developers.notion.com/)

## 🎯 ¿Qué hace este proyecto?

Extrae automáticamente datos de **casos de prueba e incidencias** desde tus bases de datos de Notion, los procesa y genera **reportes ejecutivos listos para presentar a gerencia**.

### ✨ Características principales

- 🚀 **Extracción automática** desde múltiples proyectos en Notion
- 📈 **Reportes gerenciales** en formato TXT y JSON  
- 🛡️ **Manejo robusto de errores** con reintentos inteligentes
- 📊 **Estadísticas completas** por proyecto y globales
- 🔄 **Rate limiting** y optimización de API calls
- 🎨 **Salida profesional** optimizada para gerencia

## 🏗️ Estructura del Proyecto

```
📁 Reporte-QA/
├── 📄 main.ts                    # 🚀 Punto de entrada principal
├── 📁 src/                       # 🔧 Código fuente optimizado
│   ├── 📄 config.ts              # ⚙️ Configuración centralizada  
│   ├── 📁 domain/                # 🏢 Lógica de negocio
│   ├── 📁 notion/                # 🔗 Integración con Notion API
│   ├── 📁 report/                # 📊 Generación de reportes
│   └── 📁 storage/               # 💾 Persistencia de datos
├── 📁 scripts/                   # 🛠️ Herramientas auxiliares
└── 📁 .archive/                  # 📦 Archivos obsoletos
```

## ⚡ Inicio Rápido

### 1️⃣ Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd Reporte-QA

# Instalar dependencias
npm run setup
```

### 2️⃣ Configuración

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