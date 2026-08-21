# ============================================
# SCRIPT GENERICO PARA COPIAR MODULOS DE ANGULAR
# USO: .\copiar-modulo.ps1 ORIGEN DESTINO
# EJEMPLO: .\copiar-modulo.ps1
# ============================================

param(
    [Parameter(Mandatory=$true, HelpMessage="Nombre del modulo origen")]
    [string]$ORIGEN,
    
    [Parameter(Mandatory=$true, HelpMessage="Nombre del modulo destino")]
    [string]$DESTINO,
    
    [Parameter(Mandatory=$false)]
    [string]$RUTA = "src/app/modulos/"
)

$ErrorActionPreference = "Stop"

$sourceDir = "$RUTA$ORIGEN"
$destDir = "$RUTA$DESTINO"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COPIANDO MODULO" -ForegroundColor Yellow
Write-Host "Origen:  $ORIGEN" -ForegroundColor White
Write-Host "Destino: $DESTINO" -ForegroundColor White
Write-Host "Ruta:    $RUTA" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

# 1. Verificar que existe el origen
if (!(Test-Path $sourceDir)) {
    Write-Host "ERROR: No existe la carpeta $sourceDir" -ForegroundColor Red
    Write-Host "Verifica que la ruta y el nombre sean correctos" -ForegroundColor Red
    exit 1
}

# 2. Verificar destino
if (Test-Path $destDir) {
    Write-Host "ADVERTENCIA: La carpeta $DESTINO ya existe." -ForegroundColor Red
    Write-Host "Deseas sobrescribirla? (S/N): " -ForegroundColor Yellow -NoNewline
    $respuesta = Read-Host
    if ($respuesta -ne 'S' -and $respuesta -ne 's') {
        Write-Host "Operacion cancelada" -ForegroundColor Red
        exit 0
    }
    Write-Host "Eliminando carpeta existente..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $destDir
}

# 3. Copiar carpeta
Write-Host "Copiando archivos..." -ForegroundColor Yellow
Copy-Item -Recurse $sourceDir $destDir

# 4. Renombrar archivos
Write-Host "Renombrando archivos..." -ForegroundColor Yellow
Get-ChildItem -Path $destDir -File | ForEach-Object {
    $newName = $_.Name -replace $ORIGEN, $DESTINO
    $newName = $newName -replace $ORIGEN.ToLower(), $DESTINO.ToLower()
    if ($_.Name -ne $newName) {
        Rename-Item -Path $_.FullName -NewName $newName
        Write-Host "  Renombrado: $($_.Name) -> $newName" -ForegroundColor Gray
    }
}

# 5. Reemplazar contenido en archivos
Write-Host "Actualizando contenido de archivos..." -ForegroundColor Yellow
$archivosProcesados = 0
Get-ChildItem -Path $destDir -Recurse -Include *.ts, *.html, *.scss, *.css, *.json | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    if ($content) {
        # Reemplazar todas las variantes
        $content = $content -replace $ORIGEN, $DESTINO
        $content = $content -replace $ORIGEN.ToLower(), $DESTINO.ToLower()
        $content = $content -replace $ORIGEN.ToUpper(), $DESTINO.ToUpper()
        
        # Versión con primera letra mayúscula
        $primeraMayusculaOrigen = $ORIGEN.Substring(0,1).ToUpper() + $ORIGEN.Substring(1).ToLower()
        $primeraMayusculaDestino = $DESTINO.Substring(0,1).ToUpper() + $DESTINO.Substring(1).ToLower()
        $content = $content -replace $primeraMayusculaOrigen, $primeraMayusculaDestino
        
        Set-Content -Path $_.FullName -Value $content -NoNewline
        $archivosProcesados++
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MODULO $DESTINO CREADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "Archivos procesados: $archivosProcesados" -ForegroundColor White
Write-Host "Ubicacion: $destDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Mostrar estructura creada
Write-Host "`nEstructura creada:" -ForegroundColor Yellow
Get-ChildItem -Path $destDir | ForEach-Object {
    if ($_.PSIsContainer) {
        Write-Host "$($_.Name)/" -ForegroundColor Cyan
    } else {
        Write-Host "$($_.Name)" -ForegroundColor Gray
    }
}