#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de recuperación automática de Git para el proyecto ReporteQA
    
.DESCRIPTION
    Soluciona el error "cannot open '.git/FETCH_HEAD'" y otros problemas comunes
    sin necesidad de eliminar y volver a clonar el repositorio.
    
.EXAMPLE
    .\fix-git.ps1
    
.NOTES
    Ejecutar este script cuando aparezca el error de FETCH_HEAD
#>

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Script de Recuperacion de Git" -ForegroundColor Cyan
Write-Host "  ReporteQA - Proyecto QA" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar que estamos en un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "[ERROR] No se encuentra el directorio .git" -ForegroundColor Red
    Write-Host "        Asegurate de ejecutar este script desde la raiz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host ">> Paso 1: Verificando estado del repositorio..." -ForegroundColor Green

# Guardar el branch actual
$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    $currentBranch = "main"
    Write-Host "   [!] No se pudo detectar el branch actual, usando: $currentBranch" -ForegroundColor Yellow
} else {
    Write-Host "   Branch actual: $currentBranch" -ForegroundColor White
}

Write-Host "`n>> Paso 2: Verificando archivos Git criticos..." -ForegroundColor Green

# Verificar y crear archivos Git necesarios
$gitFiles = @(
    ".git\FETCH_HEAD",
    ".git\ORIG_HEAD",
    ".git\HEAD"
)

$fixed = $false
foreach ($file in $gitFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "   [!] Archivo faltante: $file" -ForegroundColor Yellow
        
        # Crear el archivo vacío
        try {
            $null = New-Item -Path $file -ItemType File -Force -ErrorAction Stop
            Write-Host "      -> Archivo creado exitosamente" -ForegroundColor Green
            $fixed = $true
        } catch {
            Write-Host "      [ERROR] No se pudo crear: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   OK: $file existe" -ForegroundColor Gray
    }
}

# Verificar HEAD
Write-Host "`n>> Paso 3: Verificando integridad de HEAD..." -ForegroundColor Green
try {
    $headContent = Get-Content ".git\HEAD" -Raw -ErrorAction Stop
    if (-not $headContent -or $headContent.Trim() -eq "") {
        Write-Host "   [!] HEAD esta vacio, restaurando..." -ForegroundColor Yellow
        "ref: refs/heads/$currentBranch" | Set-Content ".git\HEAD" -NoNewline
        Write-Host "      -> HEAD restaurado a: refs/heads/$currentBranch" -ForegroundColor Green
        $fixed = $true
    } else {
        Write-Host "   OK: HEAD es valido" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [!] Error leyendo HEAD, recreando..." -ForegroundColor Yellow
    "ref: refs/heads/$currentBranch" | Set-Content ".git\HEAD" -NoNewline
    $fixed = $true
}

# Limpiar referencias rotas
Write-Host "`n>> Paso 4: Limpiando referencias y cache..." -ForegroundColor Green
try {
    git gc --prune=now 2>&1 | Out-Null
    Write-Host "   -> Garbage collection completado" -ForegroundColor Green
} catch {
    Write-Host "   [!] No se pudo ejecutar garbage collection" -ForegroundColor Yellow
}

# Reparar índice si está corrupto
Write-Host "`n>> Paso 5: Verificando integridad del indice..." -ForegroundColor Green
$indexStatus = git status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   [!] Indice corrupto, reconstruyendo..." -ForegroundColor Yellow
    try {
        Remove-Item ".git\index" -Force -ErrorAction SilentlyContinue
        git reset 2>&1 | Out-Null
        Write-Host "      -> Indice reconstruido" -ForegroundColor Green
        $fixed = $true
    } catch {
        Write-Host "      [ERROR] No se pudo reconstruir el indice" -ForegroundColor Red
    }
} else {
    Write-Host "   OK: Indice es valido" -ForegroundColor Gray
}

# Sincronizar con remoto
Write-Host "`n>> Paso 6: Sincronizando con el repositorio remoto..." -ForegroundColor Green

# Verificar si hay conexión al remoto
$remoteUrl = git config --get remote.origin.url 2>$null
if ($remoteUrl) {
    Write-Host "   Remoto: $remoteUrl" -ForegroundColor White
    
    # Intentar fetch con timeout
    Write-Host "   -> Descargando cambios del remoto..." -ForegroundColor Cyan
    $fetchResult = git fetch origin 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      -> Fetch exitoso" -ForegroundColor Green
        
        # Verificar si hay cambios remotos
        $behind = git rev-list --count HEAD..origin/$currentBranch 2>$null
        if ($behind -and $behind -gt 0) {
            Write-Host "`n   [!] Hay $behind commits nuevos en el remoto" -ForegroundColor Yellow
            Write-Host "       Opciones:" -ForegroundColor Yellow
            Write-Host "       1. git pull origin $currentBranch  (traer cambios)" -ForegroundColor Cyan
            Write-Host "       2. git reset --hard origin/$currentBranch  (descartar cambios locales)" -ForegroundColor Cyan
        } else {
            Write-Host "      -> Repositorio actualizado" -ForegroundColor Green
        }
    } else {
        Write-Host "      [!] Error en fetch: $fetchResult" -ForegroundColor Yellow
        Write-Host "      Esto puede deberse a problemas de red o permisos" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [!] No se encontro un remoto configurado" -ForegroundColor Yellow
}

# Resumen final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($fixed) {
    Write-Host "`n   Se realizaron reparaciones en el repositorio" -ForegroundColor Green
    Write-Host "   El repositorio deberia funcionar correctamente ahora`n" -ForegroundColor Green
} else {
    Write-Host "`n   No se encontraron problemas criticos" -ForegroundColor Green
    Write-Host "   El repositorio esta en buen estado`n" -ForegroundColor Green
}

# Mostrar estado final
Write-Host ">> Estado actual del repositorio:" -ForegroundColor Cyan
git status --short 2>&1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Script completado exitosamente" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Comandos útiles adicionales
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "  - Actualizar desde remoto:  git pull origin $currentBranch" -ForegroundColor Cyan
Write-Host "  - Ver cambios locales:      git status" -ForegroundColor Cyan
Write-Host "  - Descartar cambios:        git reset --hard origin/$currentBranch" -ForegroundColor Cyan
Write-Host "  - Ejecutar este script:     .\fix-git.ps1`n" -ForegroundColor Cyan
