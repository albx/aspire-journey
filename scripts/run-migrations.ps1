<#
.SYNOPSIS
    Applies EF Core migrations to the deployed Tour of Heroes API by calling
    its /admin/migrate endpoint.

.DESCRIPTION
    Run this after `aspire deploy` has finished bringing up the Docker
    Compose stack. It auto-discovers the published host port of the running
    "api" container (matches any container name ending in "-api-1") and
    POSTs to /admin/migrate using curl. Pass -ApiUrl to skip auto-discovery
    and target a specific URL instead.

    Kept as a separate script on purpose, so a demo of `aspire publish` /
    `aspire deploy` isn't interrupted by extra commands.

.PARAMETER ApiUrl
    Base URL of the running api service, e.g. http://localhost:56538.
    When omitted, the script discovers it from the running Docker container.

.PARAMETER Retries
    Number of attempts before giving up (default 5). Useful right after
    deploy, while SQL Server is still finishing startup.

.EXAMPLE
    ./run-migrations.ps1

.EXAMPLE
    ./run-migrations.ps1 -ApiUrl http://localhost:56538
#>

param(
    [string]$ApiUrl,
    [int]$Retries = 5
)

$ErrorActionPreference = 'Stop'

function Get-ApiUrl {
    $container = docker ps --filter "name=-api-1" --format '{{.Names}}' | Select-Object -First 1
    if (-not $container) {
        throw "No running container matching '*-api-1' was found. Is the app deployed (aspire deploy)?"
    }

    $portMapping = docker port $container 8080 | Select-Object -First 1
    if ($portMapping -notmatch ':(\d+)$') {
        throw "Could not determine the published host port for container '$container' (docker port output: '$portMapping')."
    }

    return "http://localhost:$($Matches[1])"
}

if (-not $ApiUrl) {
    $ApiUrl = Get-ApiUrl
}

Write-Host "Applying migrations via $ApiUrl/admin/migrate ..."

for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    $status = curl.exe -s -o NUL -w '%{http_code}' -X POST "$ApiUrl/admin/migrate"

    if ($status -eq '200') {
        Write-Host "Migrations applied successfully (HTTP $status)."
        exit 0
    }

    Write-Host "Attempt $attempt/$Retries failed (HTTP $status). Retrying in 2s..."
    Start-Sleep -Seconds 2
}

throw "Failed to apply migrations after $Retries attempts."
