# 🚀 Guía de Migración a v3.2.1

Esta guía te ayudará a actualizar tu entorno local a la versión refactorizada del proyecto.

## ⚡ Pasos Rápidos

### 1. Actualizar el código

```powershell
# Obtener los últimos cambios
git pull origin main

# Instalar dependencias (por si acaso)
npm install

# Compilar el proyecto
npm run build
```

### 2. Verificar que todo funciona

```powershell
# Validar configuración de Notion
npm run validate

# Ejecutar tests
npm test
```

### 3. Revisar tu archivo `.env`

La configuración de email ya está completamente funcional. Asegúrate de tener estas variables:

```env
# Email básico
EMAIL_ENABLED=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu_app_password
EMAIL_FROM=reportes-qa@empresa.com

# Destinatarios (separados por comas, SIN espacios)
EMAIL_RECIPIENTS_DAILY=email1@empresa.com,email2@empresa.com
EMAIL_RECIPIENTS_WEEKLY=email3@empresa.com,email4@empresa.com
```

## 📚 Cambios Importantes

### ✅ Lo que SIGUE FUNCIONANDO (sin cambios)

- `npm run generate:daily` - Generar reporte diario
- `npm run generate:weekly` - Generar reporte semanal
- `npm run send:daily-email` - Enviar email diario
- `npm run send:weekly-email` - Enviar email semanal
- `npm run validate` - Validar configuración
- `npm test` - Ejecutar tests

### ❌ Lo que YA NO EXISTE (eliminado)

- Archivos `.md` redundantes (toda la info está en README.md)
- Scripts de prueba en `/scripts` (test-email-*.ts)
- Archivos HTML de test (test-email-*.html)
- Scripts npm obsoletos: `reporte`, `reporte:json`, `test:email-ethereal`, etc.

### 📖 Nueva Documentación

- **README.md**: Ahora es el único archivo de documentación principal
  - Instalación completa
  - Configuración de email (Gmail/Outlook)
  - Todos los comandos disponibles
  - Solución de problemas
  - Variables de entorno completas

- **CHANGELOG.md**: Registro de cambios del proyecto
- **GIT-TROUBLESHOOTING.md**: Solución de problemas Git (mantenido)

## 🎯 Flujo de Trabajo Actualizado

### Para generar y enviar reportes manualmente:

```powershell
# Generar reporte diario
npm run generate:daily

# Enviar por email
npm run send:daily-email

# O todo en una línea
npm run generate:daily; npm run send:daily-email
```

### Para usar el scheduler automático:

1. Configura en `.env`:
```env
EMAIL_SCHEDULER_ENABLED=true
EMAIL_SCHEDULER_DAILY_TIME=16:00
EMAIL_SCHEDULER_WEEKLY_DAY=1
EMAIL_SCHEDULER_WEEKLY_TIME=09:00
```

2. Inicia el scheduler:
```powershell
npm run start:scheduler
```

El scheduler se ejecutará en segundo plano y enviará automáticamente:
- Reporte diario: Lunes a Viernes a las 16:00
- Reporte semanal: Lunes a las 09:00

## 🔍 Verificación Rápida

Ejecuta estos comandos para verificar que todo está funcionando:

```powershell
# 1. Compilación
npm run build
# Debe completar sin errores

# 2. Tests
npm test
# Debe mostrar: 33 passed

# 3. Validación de Notion
npm run validate
# Debe mostrar: Configuración válida

# 4. Prueba de conexión SMTP (opcional)
npm run test:email-connection
# Debe mostrar: Conexión SMTP exitosa
```

## ❓ ¿Problemas?

### Error: "cannot find module"
```powershell
npm install
npm run build
```

### Error: "Token de Notion inválido"
Verifica tu `.env`:
- `NOTION_TOKEN` debe empezar con `secret_`
- La integración debe tener acceso a las páginas

### Error: "Conexión SMTP fallida"
Para Gmail:
- Usa una "App Password", no tu contraseña regular
- Genera una en: https://myaccount.google.com/apppasswords

### Otros problemas
Consulta el README.md sección "🚨 Solución de Problemas"

---

## 📊 Resumen de la Refactorización

### Archivos Eliminados (9)
- ❌ GUIA-EMAIL.md
- ❌ IMPLEMENTACION-EMAIL.md
- ❌ INSTRUCCIONES-PARA-COLABORADORES.md
- ❌ CAMBIOS-V3.2.md
- ❌ INSTRUCCIONES-EMAIL.txt
- ❌ LEER-SI-HAY-ERROR-GIT.txt
- ❌ test-email-*.html (3 archivos)
- ❌ scripts/test-email-*.ts (3 archivos)

### Scripts npm Eliminados (10)
- ❌ `dev`, `generate`, `reporte`, `reporte:json`, `reporte:limpio`
- ❌ `test:email-real`, `test:email-ethereal`, `test:email-verify`

### Archivos Mantenidos
- ✅ README.md (renovado y consolidado)
- ✅ GIT-TROUBLESHOOTING.md (útil para problemas Git)
- ✅ CHANGELOG.md (nuevo - registro de cambios)
- ✅ .env.example (actualizado)

### Resultado
- 🎯 Documentación más clara y centralizada
- 🧹 Proyecto más limpio y fácil de mantener
- ✅ Toda la funcionalidad intacta
- 🧪 33/33 tests pasando
- 🚀 Listo para producción

---

**¿Listo?** Ejecuta estos 3 comandos y estarás actualizado:

```powershell
git pull origin main
npm install
npm run build
```

¡Eso es todo! 🎉
