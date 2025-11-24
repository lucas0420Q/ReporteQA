# 📊 ReporteQA - Sistema Automático de Reportes QA

> Sistema automatizado de reportes QA con integración a Notion y envío automático de emails

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green)](https://nodejs.org/)
[![Notion API](https://img.shields.io/badge/Notion%20API-2.2-black)](https://developers.notion.com/)

## 🎯 ¿Qué hace este proyecto?

**ReporteQA** extrae automáticamente datos de **Casos de Prueba (CP)** e **Incidencias (RI)** desde tus bases de datos de Notion, genera reportes estructurados en formato JSON, y los envía por email con tablas HTML profesionales.

### ✨ Características principales

- 📊 **2 Tipos de Reportes**: Diario (cambios) + Semanal (métricas agregadas)
- 📈 **Exportación CSV**: Reportes semanales en formato CSV compatible con Excel (delimitador configurable)
- 📧 **Envío Automático de Emails**: Correos HTML con tablas profesionales (sin archivos adjuntos)
- ⏰ **Scheduler Integrado**: Envío automático configurable (ej: diario 16:00, semanal lunes 09:00)
- 🔄 **Reintentos Automáticos**: Backoff exponencial en caso de fallos SMTP
- 📝 **Logs Detallados**: Registro completo de operaciones en `logs/`
- 🔢 **Ordenamiento Numérico**: IDs ordenados correctamente (CP-7 antes de CP-10)
- 🏷️ **Detección de Cambios**: Clasifica items como nuevos, modificados o eliminados
- 📸 **Sistema de Snapshots**: Guarda estado diario para comparaciones precisas
- 🌎 **Timezone Configurable**: Manejo correcto de zonas horarias
- 🛡️ **Manejo Robusto de Errores**: Continúa aunque falle un proyecto individual
- 💾 **Histórico sin Sobrescritura**: Los reportes nunca se pierden, sistema de archivado automático

---

## 🚀 Inicio Rápido

### 1️⃣ Requisitos Previos

- **Node.js 22+** (versión recomendada)
- **Cuenta de Notion** con integración configurada
- **Servidor SMTP** (Gmail, Outlook, etc.) para envío de correos

### 2️⃣ Instalación

```powershell
# Clonar el repositorio
git clone <tu-repo-url>
cd ReporteQA

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### 3️⃣ Configuración

#### A. Crear archivo `.env`

```powershell
# Copiar plantilla de ejemplo
Copy-Item .env.example .env
```

#### B. Configurar variables esenciales

Edita `.env` con tus credenciales:

```env
# === NOTION ===
NOTION_TOKEN=secret_tu_token_aqui
NOTION_PROJECTS_DB_ID=tu_database_id_aqui

# === EMAIL ===
EMAIL_ENABLED=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu_app_password_aqui
EMAIL_FROM=reportes-qa@empresa.com

# Destinatarios (separados por comas, sin espacios)
EMAIL_RECIPIENTS_DAILY=destinatario1@empresa.com,destinatario2@empresa.com
EMAIL_RECIPIENTS_WEEKLY=destinatario3@empresa.com,destinatario4@empresa.com

# === OTROS ===
TIMEZONE=America/Asuncion
```

#### C. Validar configuración

```powershell
npm run validate
```

Si todo está correcto, verás:
```
>> Validando configuración...
   Configuración válida
   Workspace: <workspace-id>
   Bot ID: <bot-id>
```

---

## 📖 Uso

### Generar Reportes

#### Reporte Diario (cambios detectados)

```powershell
npm run generate:daily
```

Esto genera:
- `reports/diarios/reporte-diario-YYYY-MM-DD.json` (archivo con histórico)
- `reports/latest-daily.json` (alias al más reciente)

**Nota**: Los reportes diarios mantienen histórico automático. No se sobrescriben.

#### Reporte Semanal (métricas agregadas)

```powershell
npm run generate:weekly
```

Esto genera:
- `reports/semanales/reporte-semanal-YYYY-MM-DD.json` (archivo con histórico)
- `reports/latest-weekly.json` (alias al más reciente)

**Nota**: Los reportes semanales mantienen histórico automático. No se sobrescriben.

### Exportar a CSV

#### Exportar último reporte semanal a CSV

```powershell
npm run export:weekly-csv
```

Esto genera:
- `reports/semanales/csv/reporte-semanal-YYYY-MM-DD.csv`

El CSV incluye dos tablas:
1. **Casos de Prueba (CP)**: CP_nuevos, CP_con_cambios, CP_pendientes, CP_en_curso, CP_finalizados
2. **Reportes de Incidencias (RI)**: RI_nuevas, RI_con_cambios, RI_pendientes, RI_en_curso, RI_devuelto, RI_finalizado, RI_resuelto

##### 📌 Compatibilidad con Excel (Español)

El CSV se genera con **punto y coma (;)** como delimitador y codificación **UTF-8 con BOM**, lo que garantiza:
- ✅ Apertura correcta en Excel (versión español) con columnas separadas
- ✅ Caracteres especiales (tildes, ñ) correctamente renderizados
- ✅ Sin necesidad de importación manual

Si usas Excel en **inglés**, puedes cambiar el delimitador en `src/config/csv-config.ts`:
```typescript
export const CSV_DELIMITER = ','; // Cambiar de ';' a ','
```

##### 🔍 Campos de Cambios

Los campos `CP_con_cambios` y `RI_con_cambios` reflejan el **número total de items que cambiaron de estado** durante la semana comparada con el snapshot de hace 5 días hábiles. Esto incluye:
- Items que pasaron de "Pendiente" → "En curso"
- Items que pasaron de "En curso" → "Finalizado"
- Items que pasaron de "Pendiente" → "Devuelto"
- Cualquier otro cambio de estado detectado

**Nota**: Si no existe un snapshot anterior, estos campos aparecerán en `0`.

#### Exportar reporte semanal específico a CSV

```powershell
npm run export:weekly-csv-custom -- --json ./reports/semanales/reporte-semanal-2025-11-18.json
```

### Listar Reportes Disponibles

#### Ver todos los reportes diarios

```powershell
npm run list:daily
```

#### Ver todos los reportes semanales

```powershell
npm run list:weekly
```

### Enviar Reportes por Email

#### Envío Manual

```powershell
# Enviar reporte diario
npm run send:daily-email

# Enviar reporte semanal
npm run send:weekly-email

# Probar conexión SMTP (sin enviar email)
npm run test:email-connection
```

#### Envío Automático (Scheduler)

Para activar el scheduler automático, configura en `.env`:

```env
EMAIL_SCHEDULER_ENABLED=true
EMAIL_SCHEDULER_DAILY_TIME=16:00
EMAIL_SCHEDULER_WEEKLY_DAY=1
EMAIL_SCHEDULER_WEEKLY_TIME=09:00
EMAIL_SCHEDULER_TIMEZONE=America/Asuncion
```

Luego inicia el scheduler:

```powershell
# Iniciar scheduler (proceso persistente)
npm run start:scheduler

# Ver estado del scheduler
npm run status:scheduler
```

El scheduler quedará corriendo y enviará automáticamente:
- **Reporte diario**: Todos los días a las 16:00
- **Reporte semanal**: Todos los lunes a las 09:00

---

## 📧 Configuración de Email (Detallada)

### Gmail

1. **Habilitar 2FA** en tu cuenta de Gmail
   - Ve a https://myaccount.google.com/security
   - Activa "Verificación en dos pasos"

2. **Generar App Password**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Otra (nombre personalizado)" → "ReporteQA"
   - Copia la contraseña de 16 caracteres generada

3. **Configurar en `.env`**
   ```env
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_SECURE=false
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=tu-email@gmail.com
   ```

⚠️ **Importante**: Usa la "App Password" generada, NO tu contraseña de Gmail.

### Outlook / Office 365

```env
EMAIL_SMTP_HOST=smtp.office365.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu_password_aqui
EMAIL_FROM=tu-email@outlook.com
```

### Otros Proveedores SMTP

Consulta la documentación de tu proveedor para obtener:
- Host SMTP (ej: `smtp.tuproveedor.com`)
- Puerto SMTP (ej: `587` o `465`)
- Si usa TLS/SSL (generalmente `false` para puerto 587)

---

## 📊 Estructura de Reportes

### Reporte Diario

El reporte diario muestra **solo los items que cambiaron** desde el día anterior:

```json
{
  "fecha_hora": "2025-11-20 10:30:00",
  "zona_horaria": "America/Asuncion",
  "proyectos": [
    {
      "nombre": "CRM Celexx",
      "matriz_pruebas": {
        "total_actual": 79,
        "por_estado": {
          "Finalizado": 40,
          "En curso": 25,
          "Pendiente": 14
        },
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
        "por_estado": { "Abierta": 10, "Resuelta": 114 },
        "cambios": []
      }
    }
  ]
}
```

**Tipos de cambio detectados:**
- `nuevo`: Item agregado hoy
- `modificado`: Estado o contenido cambió
- `eliminado`: Item removido

### Reporte Semanal

El reporte semanal muestra **métricas agregadas** de la semana actual:

```json
{
  "semana": "2025-W47",
  "fecha_hora": "2025-11-20 10:30:00",
  "zona_horaria": "America/Asuncion",
  "proyectos": [
    {
      "nombre": "Proyecto X",
      "casos_agregados_semana": 45,
      "incidencias_devueltas_semana": 11,
      "incidencias_resueltas_semana": 23,
      "casos_prueba_finalizados_semana": 20,
      "casos_prueba_pendientes": 31
    }
  ]
}
```

---

## 📁 Estructura del Proyecto

```
ReporteQA/
├── src/
│   ├── config/
│   │   └── email-config.ts         # Configuración de email (PAUSADO)
│   ├── domain/
│   │   ├── tipos-reportes-simple.ts # Tipos TypeScript
│   │   ├── constants.ts             # Constantes centralizadas
│   │   ├── date-utils.ts            # Utilidades de fecha
│   │   ├── snapshot-manager.ts      # Gestor de snapshots
│   │   └── diff-engine-*.ts         # Motores de comparación
│   ├── email/                       # Sistema de email (PAUSADO)
│   │   ├── email-service.ts
│   │   ├── email-templates.ts
│   │   └── email-orchestrator.ts
│   ├── notion/
│   │   ├── client.ts                # Cliente Notion API
│   │   └── fetch.ts                 # Fetcher con rate limiting
│   ├── report/
│   │   ├── json-generator-daily-simple.ts
│   │   ├── json-generator-weekly-simple.ts
│   │   └── csv-exporter-weekly.ts   # Exportador CSV
│   ├── scheduler/                   # Scheduler (PAUSADO)
│   │   └── email-scheduler.ts
│   ├── types/
│   │   └── report-types.ts          # Tipos para reportes y CSV
│   ├── utils/
│   │   ├── logger.ts                # Sistema de logging
│   │   └── fs-reports.ts            # Utilidades de filesystem
│   └── index.ts                     # CLI principal
│
├── reports/                         # Reportes generados
│   ├── latest-daily.json            # Alias al reporte diario más reciente
│   ├── latest-weekly.json           # Alias al reporte semanal más reciente
│   ├── diarios/                     # Histórico de reportes diarios
│   │   ├── reporte-diario-2025-11-18.json
│   │   ├── reporte-diario-2025-11-19.json
│   │   └── reporte-diario-2025-11-20.json
│   └── semanales/                   # Histórico de reportes semanales
│       ├── reporte-semanal-2025-11-18.json
│       ├── reporte-semanal-2025-11-25.json
│       └── csv/                     # Exportaciones CSV
│           ├── reporte-semanal-2025-11-18.csv
│           └── reporte-semanal-2025-11-25.csv
│
├── snapshots/                       # Snapshots diarios
│   ├── latest.json
│   └── YYYY/MM/DD/...
│
├── logs/                            # Logs de operaciones
│   └── email-YYYY-MM-DD.log
│
├── tests/                           # Tests unitarios
│   └── email.spec.ts
│
├── .env                             # Configuración (NO subir a Git)
├── .env.example                     # Plantilla de configuración
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Comandos Disponibles

### Generación de Reportes

| Comando | Descripción |
|---------|-------------|
| `npm run generate:daily` | Generar reporte diario (cambios) con histórico |
| `npm run generate:weekly` | Generar reporte semanal (métricas) con histórico |
| `npm run validate` | Validar configuración y conexión Notion |

### Exportación y Gestión

| Comando | Descripción |
|---------|-------------|
| `npm run export:weekly-csv` | Exportar último reporte semanal a CSV |
| `npm run export:weekly-csv-custom` | Exportar reporte semanal específico a CSV |
| `npm run list:daily` | Listar todos los reportes diarios disponibles |
| `npm run list:weekly` | Listar todos los reportes semanales disponibles |

### Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm test` | Ejecutar tests con Playwright |
| `npm run lint` | Verificar código con ESLint |
| `npm run format` | Formatear código con Prettier |
| `npm run clean` | Limpiar archivos compilados |

---

## 🧪 Tests

El proyecto incluye tests unitarios para el sistema de email:

```powershell
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo UI
npm run test:ui
```

Los tests cubren:
- ✅ Generación de plantillas HTML (daily y weekly)
- ✅ Validación de configuración de email
- ✅ Escape de HTML para prevención de XSS
- ✅ Truncamiento de cambios (máximo 10 por categoría)
- ✅ Badges de tipo de cambio (nuevo/modificado/eliminado)

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Protección de Credenciales

- **NUNCA** subir el archivo `.env` al repositorio
- **NUNCA** hacer commit de tokens o contraseñas hardcodeadas
- **SIEMPRE** usar `.env` para credenciales sensibles
- **SIEMPRE** usar `.gitignore` para excluir `.env`

### Variables Sensibles

Estas variables contienen información sensible y NO deben compartirse:
- `NOTION_TOKEN`
- `EMAIL_PASSWORD`
- `AWS_SECRET_ACCESS_KEY` (si usas AWS)

---

## 🚨 Solución de Problemas

### Error: "Token de Notion inválido"

1. Verifica que tu token empiece con `secret_` o `ntn_`
2. Confirma que la integración tiene acceso a las páginas
3. Regenera el token si es necesario

### Error: "Conexión SMTP fallida"

1. **Gmail**: Asegúrate de usar "App Password", no tu contraseña regular
2. **Outlook**: Verifica que tu cuenta no tenga restricciones de seguridad
3. **Firewall**: Confirma que los puertos 587 o 465 están abiertos
4. Prueba con: `npm run test:email-connection`

### Error: "Archivo de reporte no encontrado"

Primero genera el reporte antes de intentar enviarlo:

```powershell
# Generar y enviar en secuencia
npm run generate:daily
npm run send:daily-email
```

### No se detectan cambios en el reporte diario

- El sistema compara con el snapshot del día anterior
- Si es el primer día, no habrá snapshot previo para comparar
- Verifica que los datos en Notion hayan cambiado realmente

---

## 📚 Variables de Entorno (Referencia Completa)

### Notion

```env
NOTION_TOKEN=secret_xxx              # Token de integración
NOTION_PROJECTS_DB_ID=xxx            # ID de base de datos de proyectos
```

### Email - Básico

```env
EMAIL_ENABLED=true                   # Activar/desactivar email
EMAIL_SMTP_HOST=smtp.gmail.com       # Host SMTP
EMAIL_SMTP_PORT=587                  # Puerto SMTP
EMAIL_SMTP_SECURE=false              # Usar SSL/TLS directo
EMAIL_USER=email@ejemplo.com         # Usuario SMTP
EMAIL_PASSWORD=password              # Contraseña o App Password
EMAIL_FROM=reportes@ejemplo.com      # Remitente
```

### Email - Destinatarios

```env
EMAIL_RECIPIENTS_DAILY=email1@x.com,email2@x.com   # Diario
EMAIL_RECIPIENTS_WEEKLY=email3@x.com,email4@x.com  # Semanal
```

### Email - Personalización

```env
EMAIL_SUBJECT_DAILY=Reporte diario de avances QA
EMAIL_SUBJECT_WEEKLY=Reporte semanal de avances QA
EMAIL_INTRO_DAILY=Saludos cordiales, por este medio...
EMAIL_INTRO_WEEKLY=Saludos cordiales, por este medio...
```

### Email - Reintentos

```env
EMAIL_MAX_RETRIES=3                  # Número de reintentos
EMAIL_RETRY_DELAY_MS=1000            # Delay inicial (ms)
EMAIL_RETRY_BACKOFF=2                # Multiplicador de backoff
```

### Email - Scheduler

```env
EMAIL_SCHEDULER_ENABLED=true         # Activar scheduler
EMAIL_SCHEDULER_DAILY_TIME=16:00     # Hora diaria (HH:MM)
EMAIL_SCHEDULER_WEEKLY_DAY=1         # Día semanal (0=Dom, 1=Lun, ...)
EMAIL_SCHEDULER_WEEKLY_TIME=09:00    # Hora semanal (HH:MM)
EMAIL_SCHEDULER_TIMEZONE=America/Asuncion
```

### Otros

```env
TIMEZONE=America/Asuncion            # Zona horaria para reportes
```

---

## 📝 Changelog

### v3.2.0 (Actual)
- ✅ Sistema completo de envío de emails HTML
- ✅ Scheduler automático con node-cron
- ✅ Reintentos con backoff exponencial
- ✅ Templates HTML profesionales
- ✅ Tests unitarios para email
- ✅ Logs detallados
- ✅ Documentación consolidada

### v3.1.0
- ✅ Generadores simplificados (daily + weekly)
- ✅ Ordenamiento numérico por ID
- ✅ Clasificación de cambios (nuevo/modificado/eliminado)

### v2.0.0
- ✅ Integración con Notion API
- ✅ Sistema de snapshots
- ✅ Soporte múltiples proyectos

---

## 👤 Autor

**Lucas Zaracho**  
ReporteQA - Sistema Automático de Reportes QA

---

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles

---

**🚀 ¿Listo para empezar?**

```powershell
npm install
npm run build
npm run validate
npm run generate:daily
npm run send:daily-email
```

¡Tus reportes QA automatizados están listos! 🎉
