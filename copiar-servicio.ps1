# ============================================
# SCRIPT GENERICO PARA COPIAR SERVICIOS DE ANGULAR
# USO: .\copiar-servicio.ps1 ORIGEN DESTINO
# EJEMPLO: .\copiar-servicio.ps1
# ============================================

param(
    [Parameter(Mandatory=$true, HelpMessage="Nombre del servicio origen (sin .service)")]
    [string]$ORIGEN,
    
    [Parameter(Mandatory=$true, HelpMessage="Nombre del servicio destino (sin .service)")]
    [string]$DESTINO,
    
    [Parameter(Mandatory=$false)]
    [string]$RUTA = "src/app/services/"
)

$ErrorActionPreference = "Stop"

# Construir rutas completas con carpeta del servicio
$sourceDir = "$RUTA$ORIGEN"
$sourceFile = "$sourceDir/$ORIGEN.service.ts"
$sourceSpec = "$sourceDir/$ORIGEN.service.spec.ts"

$destDir = "$RUTA$DESTINO"
$destFile = "$destDir/$DESTINO.service.ts"
$destSpec = "$destDir/$DESTINO.service.spec.ts"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COPIANDO SERVICIO" -ForegroundColor Yellow
Write-Host "Origen:  $ORIGEN.service.ts" -ForegroundColor White
Write-Host "Destino: $DESTINO.service.ts" -ForegroundColor White
Write-Host "Ruta:    $RUTA" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

# 1. Verificar que existe el origen
if (!(Test-Path $sourceFile)) {
    Write-Host "ERROR: No existe el servicio en:" -ForegroundColor Red
    Write-Host "  $sourceFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que la ruta y el nombre sean correctos" -ForegroundColor Red
    Write-Host "La ruta actual es: $RUTA" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar si ya existe la carpeta destino
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

# 3. Crear carpeta destino
Write-Host "Creando carpeta destino: $destDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $destDir -Force | Out-Null

# 4. Copiar archivo del servicio
Write-Host "Copiando archivo..." -ForegroundColor Yellow
Copy-Item -Path $sourceFile -Destination $destFile -Force

# 5. Reemplazar contenido
Write-Host "Actualizando contenido..." -ForegroundColor Yellow
$content = Get-Content -Path $destFile -Raw

if ($content) {
    # Reemplazar todas las variantes
    $content = $content -replace $ORIGEN, $DESTINO
    $content = $content -replace $ORIGEN.ToLower(), $DESTINO.ToLower()
    $content = $content -replace $ORIGEN.ToUpper(), $DESTINO.ToUpper()
    
    # Version con primera letra mayuscula (para la clase)
    $primeraMayusculaOrigen = $ORIGEN.Substring(0,1).ToUpper() + $ORIGEN.Substring(1).ToLower()
    $primeraMayusculaDestino = $DESTINO.Substring(0,1).ToUpper() + $DESTINO.Substring(1).ToLower()
    $content = $content -replace $primeraMayusculaOrigen, $primeraMayusculaDestino
    
    Set-Content -Path $destFile -Value $content -NoNewline
}

# 6. Copiar archivo de pruebas (spec) si existe
if (Test-Path $sourceSpec) {
    Write-Host "Copiando archivo de pruebas..." -ForegroundColor Yellow
    Copy-Item -Path $sourceSpec -Destination $destSpec -Force
    
    $contentSpec = Get-Content -Path $destSpec -Raw
    if ($contentSpec) {
        $contentSpec = $contentSpec -replace $ORIGEN, $DESTINO
        $contentSpec = $contentSpec -replace $ORIGEN.ToLower(), $DESTINO.ToLower()
        $contentSpec = $contentSpec -replace $ORIGEN.ToUpper(), $DESTINO.ToUpper()
        $contentSpec = $contentSpec -replace $primeraMayusculaOrigen, $primeraMayusculaDestino
        Set-Content -Path $destSpec -Value $contentSpec -NoNewline
    }
    Write-Host "  Archivo de pruebas: $destSpec" -ForegroundColor Gray
} else {
    Write-Host "  No se encontro archivo de pruebas" -ForegroundColor Gray
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVICIO $DESTINO CREADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "Ubicacion: $destDir" -ForegroundColor Cyan
Write-Host "Archivo:   $destFile" -ForegroundColor Cyan
if (Test-Path $destSpec) {
    Write-Host "Pruebas:   $destSpec" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan

# Mostrar estructura creada
Write-Host ""
Write-Host "Estructura creada:" -ForegroundColor Yellow
Write-Host "  Carpeta: $DESTINO/" -ForegroundColor Cyan
Write-Host "    Archivo: $DESTINO.service.ts" -ForegroundColor Gray
if (Test-Path $destSpec) {
    Write-Host "    Archivo: $DESTINO.service.spec.ts" -ForegroundColor Gray
}

# Mostrar contenido del nuevo servicio
Write-Host ""
Write-Host "Contenido del nuevo servicio:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Get-Content $destFile
Write-Host "----------------------------------------" -ForegroundColor Gray