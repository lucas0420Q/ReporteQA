# Guía de Solución de Problemas Git

## Problema: Error `cannot open '.git/FETCH_HEAD'`

### Síntomas
```
error: cannot open '.git/FETCH_HEAD': No such file or directory
```

### Solución Rápida

**Opción 1: Script Automático (Recomendado)**
```powershell
.\fix-git.ps1
```

Este script automáticamente:
- ✅ Verifica y crea archivos Git faltantes
- ✅ Repara el índice corrupto
- ✅ Limpia referencias rotas
- ✅ Sincroniza con el remoto

**Opción 2: Configuración Preventiva**
```powershell
.\setup-git.ps1
```

Configura hooks automáticos para prevenir el problema en el futuro.

---

## Solución Manual (Paso a Paso)

Si los scripts no funcionan, ejecuta estos comandos en orden:

### 1. Crear Archivos Git Faltantes
```powershell
# Crear FETCH_HEAD
New-Item -Path ".git\FETCH_HEAD" -ItemType File -Force

# Crear ORIG_HEAD
New-Item -Path ".git\ORIG_HEAD" -ItemType File -Force

# Verificar HEAD
Get-Content ".git\HEAD"
```

### 2. Reparar el Repositorio
```powershell
# Limpiar y reparar
git gc --prune=now

# Verificar estado
git status

# Si el índice está corrupto
Remove-Item ".git\index" -Force -ErrorAction SilentlyContinue
git reset
```

### 3. Sincronizar con Remoto
```powershell
# Actualizar referencias
git fetch origin

# Traer cambios
git pull origin main
```

---

## Prevención

### Configurar Git para Mayor Estabilidad
```powershell
git config core.autocrlf true
git config core.filemode false
git config fetch.prune true
git config pull.rebase false
```

### Usar Alias para Operaciones Seguras
Agrega esto a tu perfil de PowerShell (`$PROFILE`):

```powershell
function Git-SafePull {
    # Verificar archivos antes de pull
    if (-not (Test-Path ".git\FETCH_HEAD")) {
        New-Item -Path ".git\FETCH_HEAD" -ItemType File -Force | Out-Null
    }
    git pull $args
}

Set-Alias -Name gpull -Value Git-SafePull
```

Uso: `gpull origin main`

---

## Comandos Útiles

### Verificar Estado del Repositorio
```powershell
# Ver estado
git status

# Ver archivos Git críticos
Get-ChildItem .git -File | Select-Object Name, Length

# Ver configuración actual
git config --list --local
```

### Operaciones Seguras
```powershell
# Guardar cambios antes de actualizar
git stash
git pull origin main
git stash pop

# Descartar cambios locales y sincronizar
git fetch origin
git reset --hard origin/main
```

---

## Problemas Comunes

### Problema: "Permission denied"
**Solución:**
```powershell
# Verificar permisos
icacls .git

# Tomar control de la carpeta .git
takeown /f .git /r /d y
icacls .git /grant ${env:USERNAME}:F /t
```

### Problema: "Index corrupted"
**Solución:**
```powershell
Remove-Item ".git\index" -Force
git reset
git status
```

### Problema: "HEAD detached"
**Solución:**
```powershell
# Volver a main
git checkout main

# Si no funciona, recrear HEAD
"ref: refs/heads/main" | Set-Content ".git\HEAD" -NoNewline
git checkout main
```

---

## Flujo de Trabajo Recomendado

### Antes de Hacer Push
```powershell
# 1. Verificar estado
git status

# 2. Guardar cambios
git add .
git commit -m "Descripción del cambio"

# 3. Actualizar desde remoto
git pull origin main

# 4. Resolver conflictos si hay

# 5. Hacer push
git push origin main
```

### Después de Hacer Pull (Para tu Jefe)
```powershell
# Si aparece el error de FETCH_HEAD
.\fix-git.ps1

# Luego actualizar
git pull origin main
```

---

## Archivos de Ayuda Incluidos

| Archivo | Descripción |
|---------|-------------|
| `fix-git.ps1` | Reparación automática del repositorio |
| `setup-git.ps1` | Configuración preventiva con hooks |
| `GIT-TROUBLESHOOTING.md` | Esta guía |

---

## Contacto y Soporte

Si los problemas persisten:

1. Ejecuta `.\fix-git.ps1` y copia la salida completa
2. Ejecuta `git config --list --local`
3. Comparte la información con el equipo

**Nota:** Ya **NO** es necesario eliminar y volver a clonar el repositorio. Los scripts automáticos solucionan el problema en segundos.
