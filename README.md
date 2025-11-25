# 📊 Sistema de Reportes QA - Notion API

> **Versión**: 3.2.0 | Node.js >= 18.0.0 | Última actualización: Noviembre 2025

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Notion API](https://img.shields.io/badge/Notion%20API-2.2-black)](https://developers.notion.com/)

---

## 🎯 ¿Qué hace?

Sistema automatizado que extrae información de proyectos QA desde **Notion**, genera reportes comparativos (diarios/semanales) y exporta en **JSON** y **CSV**.

### ✨ Características

- 📊 **Reportes Diarios**: Cambios del día (nuevos + modificados)
- 📈 **Reportes Semanales**: Métricas agregadas de la semana
- 📋 **CSV Excel-compatible**: Delimitador `;` para español
- 📸 **Snapshots**: Comparaciones precisas con histórico
- 🔢 **Orden numérico**: CP-7 antes de CP-10
- 🛡️ **Robusto**: Continúa si un proyecto falla
- 💾 **Sin sobrescritura**: Histórico completo

---

## 📚 Documentación completa

**📖 [Ver DOCUMENTACION.md](./DOCUMENTACION.md)**

Incluye:
- 👥 **Para QA/Negocio**: Qué hace, tipos de reportes, contadores
- 🔧 **Para DevOps**: Instalación, arquitectura, scripts, troubleshooting

---

## 🚀 Inicio rápido

### 1. Instalación

```bash
npm install
npm run build
```

### 2. Configuración

Crear `.env`:

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PROJECTS_DB_ID=your-projects-db-id
MATRIZ_DB_NAME=Matriz de Pruebas
INCIDENCIAS_DB_NAME=Reporte de Incidencias
```

### 3. Validar y ejecutar

```bash
npm run validate              # Verificar configuración
npm run generate:daily        # Reporte diario
npm run generate:weekly       # Reporte semanal
npm run export:weekly-csv     # Exportar a CSV
```

---

## 📦 Comandos principales

| Comando | Descripción |
|---------|-------------|
| `npm run generate:daily` | Genera reporte diario |
| `npm run generate:weekly` | Genera reporte semanal |
| `npm run export:weekly-csv` | Exporta a CSV |
| `npm run list:daily` | Lista reportes diarios |
| `npm run list:weekly` | Lista reportes semanales |
| `npm run validate` | Valida configuración |

Ver todos: `npm run`

---

## 📁 Reportes generados

```
reports/
├── latest-daily.json          # Último diario
├── latest-weekly.json         # Último semanal
├── diarios/
│   └── reporte-diario-YYYY-MM-DD.json
└── semanales/
    ├── reporte-semanal-YYYY-MM-DD-HHMMSS.json
    └── csv/
        └── reporte-semanal-YYYY-MM-DD.csv
```

---

## 🏗️ Stack tecnológico

- **Runtime**: Node.js >= 18.0.0
- **Lenguaje**: TypeScript 5.3+
- **API**: Notion SDK
- **Testing**: Playwright
- **Linting**: ESLint + Prettier

---

## 📄 Licencia

MIT

---

## 📞 Soporte

- **Documentación completa**: [DOCUMENTACION.md](./DOCUMENTACION.md)
- **Issues**: GitHub Issues
- **Contacto**: Equipo DevOps / QA

---

**Mantenido por**: Equipo DevOps | **Última actualización**: Noviembre 2025
