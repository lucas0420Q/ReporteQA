#!/usr/bin/env pwsh
# Script para visualizar cambios diarios con clasificación

$reportePath = "reports\latest-daily.json"

if (-not (Test-Path $reportePath)) {
    Write-Host "`n[ERROR] No se encuentra el reporte diario" -ForegroundColor Red
    Write-Host "        Ejecuta primero: npm run generate:daily`n" -ForegroundColor Yellow
    exit 1
}

$reporte = Get-Content $reportePath | ConvertFrom-Json

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "         REPORTE DIARIO DE CAMBIOS - QA" -ForegroundColor Cyan  
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "`nFecha/Hora: $($reporte.fecha_hora)" -ForegroundColor Green
Write-Host "Proyectos Analizados: $($reporte.proyectos.Count)" -ForegroundColor Green

# Calcular totales globales
$totalNuevos = 0
$totalModificados = 0
$totalEliminados = 0
$proyectosConCambios = 0

foreach($p in $reporte.proyectos) {
    $cambios = $p.matriz_pruebas.cambios + $p.incidencias.cambios
    if($cambios.Count -gt 0) {
        $proyectosConCambios++
        $totalNuevos += ($cambios | Where-Object { $_.tipo_cambio -eq 'nuevo' }).Count
        $totalModificados += ($cambios | Where-Object { $_.tipo_cambio -eq 'modificado' }).Count
        $totalEliminados += ($cambios | Where-Object { $_.tipo_cambio -eq 'eliminado' }).Count
    }
}

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host "                    RESUMEN GLOBAL" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow

Write-Host "`nProyectos con cambios: $proyectosConCambios de $($reporte.proyectos.Count)" -ForegroundColor Cyan
Write-Host "`n[+] Items Nuevos:      $totalNuevos" -ForegroundColor Green
Write-Host "[~] Items Modificados: $totalModificados" -ForegroundColor Yellow
Write-Host "[-] Items Eliminados:  $totalEliminados" -ForegroundColor Red
Write-Host "`nTotal de cambios:     $($totalNuevos + $totalModificados + $totalEliminados)" -ForegroundColor Magenta

# Detalles por proyecto
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "                DETALLES POR PROYECTO" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

foreach($p in $reporte.proyectos) {
    $cambiosMatriz = $p.matriz_pruebas.cambios
    $cambiosIncidencias = $p.incidencias.cambios
    $totalCambios = $cambiosMatriz.Count + $cambiosIncidencias.Count
    
    if($totalCambios -eq 0) {
        continue
    }
    
    Write-Host "`n--------------------------------------------------------" -ForegroundColor Gray
    Write-Host "PROYECTO: $($p.nombre)" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------" -ForegroundColor Gray
    
    # Estadísticas del proyecto
    $allCambios = $cambiosMatriz + $cambiosIncidencias
    $nuevosProyecto = ($allCambios | Where-Object { $_.tipo_cambio -eq 'nuevo' }).Count
    $modificadosProyecto = ($allCambios | Where-Object { $_.tipo_cambio -eq 'modificado' }).Count
    $eliminadosProyecto = ($allCambios | Where-Object { $_.tipo_cambio -eq 'eliminado' }).Count
    
    Write-Host "`nEstado:" -ForegroundColor White
    Write-Host "  Casos de Prueba: $($p.matriz_pruebas.total_actual) total - $($cambiosMatriz.Count) cambios" -ForegroundColor Cyan
    Write-Host "  Incidencias: $($p.incidencias.total_actual) total - $($cambiosIncidencias.Count) cambios" -ForegroundColor Cyan
    
    Write-Host "`nClasificacion de Cambios:" -ForegroundColor White
    Write-Host "  [+] Nuevos: $nuevosProyecto   [~] Modificados: $modificadosProyecto   [-] Eliminados: $eliminadosProyecto" -ForegroundColor Cyan
    
    # Mostrar cambios de matriz
    if($cambiosMatriz.Count -gt 0) {
        Write-Host "`nCambios en Matriz de Pruebas:" -ForegroundColor Magenta
        foreach($cambio in $cambiosMatriz | Select-Object -First 5) {
            $icono = switch($cambio.tipo_cambio) {
                'nuevo' { '[+]' }
                'modificado' { '[~]' }
                'eliminado' { '[-]' }
            }
            $color = switch($cambio.tipo_cambio) {
                'nuevo' { 'Green' }
                'modificado' { 'Yellow' }
                'eliminado' { 'Red' }
            }
            
            Write-Host "  $icono ID: $($cambio.id) - $($cambio.titulo)" -ForegroundColor $color
            
            if($cambio.estado_anterior) {
                Write-Host "     $($cambio.estado_anterior) -> $($cambio.estado_actual)" -ForegroundColor Gray
            } else {
                Write-Host "     Estado: $($cambio.estado_actual)" -ForegroundColor Gray
            }
        }
        
        if($cambiosMatriz.Count -gt 5) {
            Write-Host "  ... y $($cambiosMatriz.Count - 5) cambios mas" -ForegroundColor DarkGray
        }
    }
    
    # Mostrar cambios de incidencias
    if($cambiosIncidencias.Count -gt 0) {
        Write-Host "`nCambios en Incidencias:" -ForegroundColor Magenta
        foreach($cambio in $cambiosIncidencias | Select-Object -First 5) {
            $icono = switch($cambio.tipo_cambio) {
                'nuevo' { '[+]' }
                'modificado' { '[~]' }
                'eliminado' { '[-]' }
            }
            $color = switch($cambio.tipo_cambio) {
                'nuevo' { 'Green' }
                'modificado' { 'Yellow' }
                'eliminado' { 'Red' }
            }
            
            Write-Host "  $icono ID: $($cambio.id) - $($cambio.titulo)" -ForegroundColor $color
            
            if($cambio.estado_anterior) {
                Write-Host "     $($cambio.estado_anterior) -> $($cambio.estado_actual)" -ForegroundColor Gray
            } else {
                Write-Host "     Estado: $($cambio.estado_actual)" -ForegroundColor Gray
            }
        }
        
        if($cambiosIncidencias.Count -gt 5) {
            Write-Host "  ... y $($cambiosIncidencias.Count - 5) cambios mas" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "                 REPORTE COMPLETADO" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green

Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "  - Ver reporte JSON:    code reports\latest-daily.json" -ForegroundColor Cyan
Write-Host "  - Generar nuevo:       npm run generate:daily" -ForegroundColor Cyan
Write-Host "  - Ver semanal:         npm run generate:weekly`n" -ForegroundColor Cyan
