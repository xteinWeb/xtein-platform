[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$Microfrontend,

    [Parameter(Mandatory = $false)]
    [string]$ApplicationId,

    [Parameter(Mandatory = $false)]
    [string]$Table,

    [Parameter(Mandatory = $false)]
    [string]$Description,

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    Write-Host ''
    Write-Host ('=' * 68) -ForegroundColor DarkCyan
    Write-Host (' ' + $Title) -ForegroundColor Cyan
    Write-Host ('=' * 68) -ForegroundColor DarkCyan
}

function Stop-Generator {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host ''
    Write-Host 'ERROR' -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    Write-Host ''
    exit 1
}

function Read-RequiredValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Prompt,

        [Parameter(Mandatory = $false)]
        [string]$CurrentValue
    )

    $value = $CurrentValue

    while ([string]::IsNullOrWhiteSpace($value)) {
        $value = Read-Host $Prompt
    }

    return $value.Trim()
}

function Get-ClassPrefix {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $segments = $Value.Split('-')
    $result = New-Object System.Text.StringBuilder

    foreach ($segment in $segments) {
        if ([string]::IsNullOrWhiteSpace($segment)) {
            continue
        }

        if ($segment -match '^\d+$') {
            [void]$result.Append($segment)
            continue
        }

        $normalized = $segment.ToLowerInvariant()
        $formatted = $normalized.Substring(0, 1).ToUpperInvariant()

        if ($normalized.Length -gt 1) {
            $formatted += $normalized.Substring(1)
        }

        [void]$result.Append($formatted)
    }

    return $result.ToString()
}

function Replace-Tokens {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value,

        [Parameter(Mandatory = $true)]
        [System.Collections.IDictionary]$Replacements
    )

    $result = $Value

    foreach ($token in $Replacements.Keys) {
        $result = $result.Replace(
            [string]$token,
            [string]$Replacements[$token]
        )
    }

    return $result
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $encoding
    )
}

function Get-ProjectRelativePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot,

        [Parameter(Mandatory = $true)]
        [string]$FullPath
    )

    $root = $ProjectRoot.TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )

    if ($FullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $FullPath.Substring($root.Length).TrimStart(
            [System.IO.Path]::DirectorySeparatorChar,
            [System.IO.Path]::AltDirectorySeparatorChar
        )
    }

    return $FullPath
}

Write-Section 'XTEIN APPLICATION GENERATOR'

$projectRoot = (Get-Location).Path

$requiredRootFiles = @(
    'angular.json',
    'package.json',
    'tsconfig.json'
)

foreach ($requiredFile in $requiredRootFiles) {
    $requiredPath = Join-Path $projectRoot $requiredFile

    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        Stop-Generator "El script debe ejecutarse desde la raiz de XTEIN Platform. No se encontro '$requiredFile' en '$projectRoot'."
    }
}

$appsPath = Join-Path $projectRoot 'apps'
$libsPath = Join-Path $projectRoot 'libs'

if (-not (Test-Path -LiteralPath $appsPath -PathType Container)) {
    Stop-Generator "No se encontro la carpeta '$appsPath'."
}

if (-not (Test-Path -LiteralPath $libsPath -PathType Container)) {
    Stop-Generator "No se encontro la carpeta '$libsPath'."
}

$templateRoot = Join-Path $PSScriptRoot 'templates'
$applicationTemplatePath = Join-Path $templateRoot 'application'
$registryTemplatePath = Join-Path $templateRoot 'registry'

if (-not (Test-Path -LiteralPath $applicationTemplatePath -PathType Container)) {
    Stop-Generator "No se encontro la plantilla de aplicacion en '$applicationTemplatePath'."
}

if (-not (Test-Path -LiteralPath $registryTemplatePath -PathType Container)) {
    Stop-Generator "No se encontro la plantilla de registro en '$registryTemplatePath'."
}

if ([string]::IsNullOrWhiteSpace($Microfrontend)) {
    $availableMicrofrontends = @(
        Get-ChildItem -LiteralPath $appsPath -Directory |
            Where-Object { $_.Name -like 'mfe-*' } |
            Sort-Object Name |
            Select-Object -ExpandProperty Name
    )

    if ($availableMicrofrontends.Count -gt 0) {
        Write-Host ''
        Write-Host 'Microfrontends disponibles:' -ForegroundColor Yellow

        foreach ($availableMicrofrontend in $availableMicrofrontends) {
            Write-Host "  - $availableMicrofrontend"
        }
    }
}

$Microfrontend = Read-RequiredValue -Prompt 'Microfrontend destino' -CurrentValue $Microfrontend

if ($Microfrontend -notmatch '^mfe-[a-z0-9][a-z0-9-]*$') {
    Stop-Generator "El nombre del microfrontend '$Microfrontend' no tiene un formato valido. Ejemplo: mfe-mad."
}

$microfrontendPath = Join-Path $appsPath $Microfrontend

if (-not (Test-Path -LiteralPath $microfrontendPath -PathType Container)) {
    Stop-Generator "El microfrontend '$Microfrontend' no existe. Ruta esperada: apps/$Microfrontend."
}

$applicationsPath = Join-Path $microfrontendPath 'src/app/applications'

if (-not (Test-Path -LiteralPath $applicationsPath -PathType Container)) {
    Stop-Generator "El microfrontend '$Microfrontend' no contiene la estructura estandar 'src/app/applications'."
}

$registryFiles = @(
    Get-ChildItem -LiteralPath $applicationsPath -Filter '*-application.registry.ts' -File
)

if ($registryFiles.Count -eq 0) {
    Stop-Generator "No se encontro el archivo '*-application.registry.ts' en 'apps/$Microfrontend/src/app/applications'."
}

if ($registryFiles.Count -gt 1) {
    Stop-Generator "Se encontro mas de un archivo '*-application.registry.ts' en '$applicationsPath'. El generador requiere un unico registro por microfrontend."
}

$registryFile = $registryFiles[0]

$ApplicationId = Read-RequiredValue -Prompt 'Application Id (ejemplo MAD-006)' -CurrentValue $ApplicationId

$ApplicationId = $ApplicationId.ToUpperInvariant()

if ($ApplicationId -notmatch '^[A-Z][A-Z0-9]*-\d{3}$') {
    Stop-Generator "El Application Id '$ApplicationId' no tiene el formato esperado. Ejemplo: MAD-006."
}

$Table = Read-RequiredValue -Prompt 'Tabla base' -CurrentValue $Table

if ($Table -notmatch '^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*){0,2}$') {
    Stop-Generator "La tabla '$Table' no tiene un formato valido. Use un identificador como EMPLEADOS o dbo.EMPLEADOS."
}

$Description = Read-RequiredValue -Prompt 'Descripcion de la aplicacion' -CurrentValue $Description

$backendId = $ApplicationId.Replace('-', '')
$applicationFilePrefix = $ApplicationId.ToLowerInvariant()
$applicationClassPrefix = Get-ClassPrefix -Value $ApplicationId

$destinationPath = Join-Path $applicationsPath $applicationFilePrefix

if (Test-Path -LiteralPath $destinationPath) {
    Stop-Generator "La aplicacion '$ApplicationId' ya tiene una ruta en '$destinationPath'. No se modifico ningun archivo."
}

$registryContent = Get-Content -LiteralPath $registryFile.FullName -Raw

if ($registryContent -match [regex]::Escape("'$ApplicationId'")) {
    Stop-Generator "El Application Id '$ApplicationId' ya aparece en '$($registryFile.FullName)'. No se modifico ningun archivo."
}

$encodedDescription = [System.Net.WebUtility]::HtmlEncode($Description)

$replacements = [ordered]@{
    '__APPLICATION_ID__' = $ApplicationId
    '__BACKEND_ID__' = $backendId
    '__APPLICATION_FILE_PREFIX__' = $applicationFilePrefix
    '__APPLICATION_CLASS_PREFIX__' = $applicationClassPrefix
    '__TABLE_NAME__' = $Table
    '__APPLICATION_DESCRIPTION__' = $encodedDescription
}

Write-Section 'RESUMEN DE GENERACION'
Write-Host "Microfrontend             : $Microfrontend"
Write-Host "Application Id            : $ApplicationId"
Write-Host "Backend Id                : $backendId"
Write-Host "Application File Prefix   : $applicationFilePrefix"
Write-Host "Application Class Prefix  : $applicationClassPrefix"
Write-Host "Tabla base                : $Table"
Write-Host "Descripcion               : $Description"
Write-Host "Destino                   : $(Get-ProjectRelativePath -ProjectRoot $projectRoot -FullPath $destinationPath)"
Write-Host "Registro                  : $(Get-ProjectRelativePath -ProjectRoot $projectRoot -FullPath $registryFile.FullName)"

if (-not $Force) {
    Write-Host ''
    $confirmation = (Read-Host 'Continuar con la generacion? [S/N]').Trim().ToUpperInvariant()

    if ($confirmation -notin @('S', 'SI', 'Y', 'YES')) {
        Write-Host ''
        Write-Host 'Generacion cancelada. No se modifico ningun archivo.' -ForegroundColor Yellow
        exit 0
    }
}

$stagingRoot = Join-Path $projectRoot ('.xtein-generator-' + [guid]::NewGuid().ToString('N'))

try {
    New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

    $templateFiles = @(
        Get-ChildItem -LiteralPath $applicationTemplatePath -File -Recurse
    )

    if ($templateFiles.Count -eq 0) {
        Stop-Generator "La plantilla '$applicationTemplatePath' no contiene archivos."
    }

    foreach ($templateFile in $templateFiles) {
        $relativeTemplatePath = $templateFile.FullName.Substring(
            $applicationTemplatePath.Length
        ).TrimStart(
            [System.IO.Path]::DirectorySeparatorChar,
            [System.IO.Path]::AltDirectorySeparatorChar
        )

        $relativeOutputPath = Replace-Tokens -Value $relativeTemplatePath -Replacements $replacements

        if ($relativeOutputPath.EndsWith('.tpl', [System.StringComparison]::OrdinalIgnoreCase)) {
            $relativeOutputPath = $relativeOutputPath.Substring(
                0,
                $relativeOutputPath.Length - 4
            )
        }

        $outputPath = Join-Path $stagingRoot $relativeOutputPath
        $outputDirectory = Split-Path -Parent $outputPath

        if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
            New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
        }

        $templateContent = Get-Content -LiteralPath $templateFile.FullName -Raw
        $outputContent = Replace-Tokens -Value $templateContent -Replacements $replacements

        Write-Utf8NoBom -Path $outputPath -Content $outputContent
    }

    $unresolvedTokens = @(
        Get-ChildItem -LiteralPath $stagingRoot -File -Recurse |
            Select-String -Pattern '__[A-Z][A-Z0-9_]*__' -AllMatches
    )

    if ($unresolvedTokens.Count -gt 0) {
        $firstMatch = $unresolvedTokens[0]
        throw "La plantilla contiene un token sin reemplazar en '$($firstMatch.Path)'."
    }

    Move-Item -LiteralPath $stagingRoot -Destination $destinationPath

} catch {
    if (Test-Path -LiteralPath $stagingRoot) {
        Remove-Item -LiteralPath $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path -LiteralPath $destinationPath) {
        Remove-Item -LiteralPath $destinationPath -Recurse -Force -ErrorAction SilentlyContinue
    }

    Stop-Generator "No fue posible generar la aplicacion. $($_.Exception.Message)"
}

$registryImportTemplate = Join-Path $registryTemplatePath 'application-registry-import.ts.tpl'
$registryEntryTemplate = Join-Path $registryTemplatePath 'application-registry-entry.ts.tpl'

if (-not (Test-Path -LiteralPath $registryImportTemplate -PathType Leaf)) {
    Stop-Generator "No se encontro '$registryImportTemplate'. La aplicacion fue creada, pero no se pudo construir la instruccion de registro."
}

if (-not (Test-Path -LiteralPath $registryEntryTemplate -PathType Leaf)) {
    Stop-Generator "No se encontro '$registryEntryTemplate'. La aplicacion fue creada, pero no se pudo construir la instruccion de registro."
}

$registryImport = Replace-Tokens -Value (Get-Content -LiteralPath $registryImportTemplate -Raw) -Replacements $replacements

$registryEntry = Replace-Tokens -Value (Get-Content -LiteralPath $registryEntryTemplate -Raw) -Replacements $replacements

$generatedFiles = @(
    Get-ChildItem -LiteralPath $destinationPath -File -Recurse |
        Sort-Object FullName
)

Write-Section 'APLICACION GENERADA CORRECTAMENTE'
Write-Host "Aplicacion : $ApplicationId"
Write-Host "Destino    : $(Get-ProjectRelativePath -ProjectRoot $projectRoot -FullPath $destinationPath)"
Write-Host ''
Write-Host 'Archivos creados:' -ForegroundColor Green

foreach ($generatedFile in $generatedFiles) {
    Write-Host ('  - ' + (Get-ProjectRelativePath -ProjectRoot $destinationPath -FullPath $generatedFile.FullName))
}

Write-Section 'ACCION MANUAL REQUERIDA'
Write-Host 'La aplicacion fue creada, pero NO fue registrada automaticamente en el microfrontend.' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Debe modificar manualmente el archivo:' -ForegroundColor Yellow
Write-Host ('  ' + (Get-ProjectRelativePath -ProjectRoot $projectRoot -FullPath $registryFile.FullName)) -ForegroundColor White
Write-Host ''
Write-Host '1. Agregue el siguiente import junto con los imports de aplicaciones existentes:' -ForegroundColor Yellow
Write-Host ''
Write-Host $registryImport -ForegroundColor White
Write-Host ''
Write-Host '2. Agregue la siguiente entrada dentro del arreglo de registro del microfrontend:' -ForegroundColor Yellow
Write-Host ''
Write-Host $registryEntry -ForegroundColor White
Write-Host ''
Write-Host 'El generador no modifica el archivo de registro para evitar alterar o sobrescribir entradas existentes.' -ForegroundColor DarkYellow
Write-Host ''
Write-Host 'Despues de registrar la aplicacion, compile el microfrontend y valide su apertura desde el shell.' -ForegroundColor Cyan
Write-Host ''
Write-Host ('=' * 68) -ForegroundColor DarkCyan
Write-Host ' GENERACION FINALIZADA' -ForegroundColor Green
Write-Host ('=' * 68) -ForegroundColor DarkCyan
