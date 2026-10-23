<#
  Levanta la platform en local: los microfrontends y al final el shell, cada uno en su propia ventana.

  Uso (desde la carpeta xtein-platform, en PowerShell):
    .\scripts\levantar-local.ps1                      # todos los microfrontends + shell
    .\scripts\levantar-local.ps1 -Apps prod,mcom      # solo esos (más el shell)
    .\scripts\levantar-local.ps1 -Apps prod -ApiRest  # también el apiRest local (Node 20)
    .\scripts\levantar-local.ps1 -SinShell            # solo microfrontends

  Los puertos son los de MICROFRONTENDS.REMOTE_ENTRY_URL en la base: el shell carga cada remoto desde ahí,
  no desde angular.json (inv, malm, mcpr y men tienen otro puerto en angular.json).
  Arranca uno a la vez y espera a que responda antes del siguiente: compilar varios a la vez agota la memoria.
  Para detenerlos, cierra sus ventanas.
#>
param(
  [string[]]$Apps = @('adm', 'dashboard', 'inv', 'mad', 'malm', 'mcom', 'mcpr', 'men', 'mfin', 'mthu', 'prod'),
  [switch]$ApiRest,
  [switch]$SinShell,
  [int]$PuertoShell = 4210,
  [string]$RutaApiRest = "$PSScriptRoot\..\..\apiRest",
  [string]$NodeApiRest = "$env:LOCALAPPDATA\nvm\v20.19.4\node.exe"
)

$ErrorActionPreference = 'Stop'
$raiz = Resolve-Path "$PSScriptRoot\.."

# Puerto de cada microfrontend según MICROFRONTENDS.REMOTE_ENTRY_URL
$puertos = [ordered]@{
  adm = 4301; dashboard = 4311; inv = 4304; mad = 4201; malm = 4308; mcom = 4305
  mcpr = 4307; men = 4302; mfin = 4208; mthu = 4209; prod = 4212
}

function Esperar-Puerto([int]$puerto, [string]$nombre, [int]$minutos = 6) {
  $limite = (Get-Date).AddMinutes($minutos)
  while ((Get-Date) -lt $limite) {
    $cliente = New-Object Net.Sockets.TcpClient
    try { $cliente.Connect('127.0.0.1', $puerto); $cliente.Close(); Write-Host "  $nombre listo en $puerto" -ForegroundColor Green; return }
    catch { Start-Sleep -Seconds 3 }
    finally { $cliente.Dispose() }
  }
  Write-Warning "$nombre no respondió en $puerto después de $minutos min: revisa su ventana."
}

function Abrir-Ventana([string]$titulo, [string]$carpeta, [string]$comando) {
  $script = "`$Host.UI.RawUI.WindowTitle = '$titulo'; Set-Location '$carpeta'; $comando"
  Start-Process powershell -ArgumentList '-NoExit', '-Command', $script | Out-Null
}

function Puerto-Ocupado([int]$puerto) {
  return [bool](Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue)
}

if ($ApiRest) {
  if (Puerto-Ocupado 5900) { Write-Host "apiRest ya está corriendo en 5900" -ForegroundColor Yellow }
  else {
    Write-Host "apiRest (5900)..."
    Abrir-Ventana 'apiRest' (Resolve-Path $RutaApiRest) "& '$NodeApiRest' src\index.js"
    Esperar-Puerto 5900 'apiRest' 2
  }
}

foreach ($app in $Apps) {
  $app = $app.Trim().ToLower() -replace '^mfe-', ''
  if (-not $puertos.Contains($app)) { Write-Warning "No conozco el microfrontend '$app' (opciones: $($puertos.Keys -join ', '))"; continue }
  $puerto = $puertos[$app]
  if (Puerto-Ocupado $puerto) { Write-Host "mfe-$app ya está corriendo en $puerto" -ForegroundColor Yellow; continue }
  Write-Host "mfe-$app ($puerto)..."
  Abrir-Ventana "mfe-$app" $raiz "node --max-old-space-size=4096 ./node_modules/@angular/cli/bin/ng serve mfe-$app --port $puerto"
  Esperar-Puerto $puerto "mfe-$app"
}

if (-not $SinShell) {
  if (Puerto-Ocupado $PuertoShell) { Write-Host "shell ya está corriendo en $PuertoShell" -ForegroundColor Yellow }
  else {
    Write-Host "shell ($PuertoShell)..."
    Abrir-Ventana 'shell' $raiz "node --max-old-space-size=8192 ./node_modules/@angular/cli/bin/ng serve shell --port $PuertoShell"
    Esperar-Puerto $PuertoShell 'shell' 8
  }
  Write-Host "Abre http://localhost:$PuertoShell" -ForegroundColor Cyan
}
