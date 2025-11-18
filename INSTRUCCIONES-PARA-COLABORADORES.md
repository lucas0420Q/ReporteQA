# 📋 Instrucciones para Colaboradores

## ⚡ Solución Rápida al Error de Git

### ❌ Problema: Error `cannot open '.git/FETCH_HEAD'`

**Antes:** Tenías que eliminar todo y volver a clonar 😫

**Ahora:** Solo ejecuta un script y listo en segundos 🎉

---

## 🚀 Solución en 1 Paso

Cuando veas el error de Git, simplemente ejecuta:

```powershell
.\fix-git.ps1
```

**¡Eso es todo!** El script:
- ✅ Verifica y crea archivos Git faltantes
- ✅ Repara el índice si está corrupto
- ✅ Limpia referencias rotas
- ✅ Sincroniza con el repositorio remoto

---

## 🔧 Primera Vez - Configuración (Opcional pero Recomendada)

Para evitar que el problema vuelva a ocurrir, ejecuta **una sola vez**:

```powershell
.\setup-git.ps1
```

Este comando configura hooks automáticos que previenen el problema.

---

## 📝 Flujo de Trabajo Actualizado

### Cuando quieras actualizar tu copia local:

**Opción A - Método Simple:**
```powershell
git pull origin main
```

**Opción B - Si aparece error de FETCH_HEAD:**
```powershell
.\fix-git.ps1
git pull origin main
```

### Cuando quieras subir cambios:

```powershell
# 1. Ver qué cambió
git status

# 2. Agregar cambios
git add .

# 3. Hacer commit
git commit -m "Descripción de los cambios"

# 4. Actualizar desde remoto (importante!)
git pull origin main

# 5. Subir tus cambios
git push origin main
```

---

## 🆘 Si Nada Funciona

### Opción de Rescate:

```powershell
# Descargar los cambios remotos
git fetch origin

# Restablecer tu copia local al estado del servidor
git reset --hard origin/main
```

**⚠️ Advertencia:** Esto descarta TODOS tus cambios locales no guardados.

---

## 📞 Ayuda Adicional

- **Guía completa:** Ver `GIT-TROUBLESHOOTING.md`
- **Scripts disponibles:**
  - `fix-git.ps1` - Reparar repositorio
  - `setup-git.ps1` - Configurar prevención
- **Problemas persistentes:** Contactar al equipo de desarrollo

---

## ✨ Resumen

| Situación | Comando |
|-----------|---------|
| 🔄 Actualizar código | `git pull origin main` |
| ❌ Error FETCH_HEAD | `.\fix-git.ps1` |
| 🛡️ Primera vez (prevención) | `.\setup-git.ps1` |
| 📤 Subir cambios | `git push origin main` |
| 🆘 Emergencia | `git reset --hard origin/main` |

---

**Ya no necesitas eliminar y volver a clonar el repositorio** 🎉

Los scripts automáticos solucionan todos los problemas comunes de Git en segundos.
