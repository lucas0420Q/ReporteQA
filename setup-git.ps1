#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de configuración de Git hooks y verificación de repositorio
    
.DESCRIPTION
    Configura hooks personalizados y verifica la integridad del repositorio
#>

Write-Host "`n>> Configurando Git hooks para evitar errores de FETCH_HEAD..." -ForegroundColor Cyan

# Verificar que estamos en un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "[ERROR] No se encuentra el directorio .git" -ForegroundColor Red
    exit 1
}

# Crear directorio de hooks si no existe
$hooksDir = ".git\hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -Path $hooksDir -ItemType Directory -Force | Out-Null
}

# Crear hook post-checkout para verificar archivos Git después de cambiar de branch
$postCheckoutHook = @"
#!/bin/sh
# Hook post-checkout: Verifica archivos Git después de cambiar de branch

FETCH_HEAD=".git/FETCH_HEAD"
if [ ! -f "`$FETCH_HEAD" ]; then
    touch "`$FETCH_HEAD"
fi

exit 0
"@

$postCheckoutHook | Set-Content "$hooksDir\post-checkout" -Encoding UTF8
Write-Host "   -> Hook post-checkout configurado" -ForegroundColor Green

# Crear hook post-merge para verificar después de merge
$postMergeHook = @"
#!/bin/sh
# Hook post-merge: Verifica archivos Git después de merge

FETCH_HEAD=".git/FETCH_HEAD"
ORIG_HEAD=".git/ORIG_HEAD"

[ ! -f "`$FETCH_HEAD" ] && touch "`$FETCH_HEAD"
[ ! -f "`$ORIG_HEAD" ] && touch "`$ORIG_HEAD"

exit 0
"@

$postMergeHook | Set-Content "$hooksDir\post-merge" -Encoding UTF8
Write-Host "   -> Hook post-merge configurado" -ForegroundColor Green

# Verificar archivos Git críticos
Write-Host "`n>> Verificando archivos Git criticos..." -ForegroundColor Cyan

$criticalFiles = @(
    ".git\FETCH_HEAD",
    ".git\ORIG_HEAD",
    ".git\HEAD",
    ".git\config"
)

foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "   [!] Creando: $file" -ForegroundColor Yellow
        
        if ($file -eq ".git\HEAD") {
            "ref: refs/heads/main" | Set-Content $file -NoNewline
        } else {
            $null = New-Item -Path $file -ItemType File -Force
        }
    } else {
        Write-Host "   OK: $file" -ForegroundColor Gray
    }
}

# Configurar Git para ser más robusto
Write-Host "`n>> Aplicando configuraciones de Git para mayor estabilidad..." -ForegroundColor Cyan

$gitConfigs = @{
    "core.autocrlf" = "true"
    "core.filemode" = "false"
    "fetch.prune" = "true"
    "pull.rebase" = "false"
}

foreach ($config in $gitConfigs.GetEnumerator()) {
    git config $config.Key $config.Value 2>&1 | Out-Null
    Write-Host "   -> $($config.Key) = $($config.Value)" -ForegroundColor Green
}

Write-Host "`n>> Configuracion completada exitosamente`n" -ForegroundColor Green

Write-Host "Comandos disponibles:" -ForegroundColor Yellow
Write-Host "  - Reparar repositorio:  .\fix-git.ps1" -ForegroundColor Cyan
Write-Host "  - Estado del repo:      git status" -ForegroundColor Cyan
Write-Host "  - Actualizar:           git pull origin main`n" -ForegroundColor Cyan
