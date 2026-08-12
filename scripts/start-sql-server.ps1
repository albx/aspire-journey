<#
.SYNOPSIS
    Starts a SQL Server 2022 container for local Tour of Heroes development.

.DESCRIPTION
    Pulls (if needed) and runs the official mssql/server Docker image,
    exposing SQL Server on localhost:1433. Data is persisted in a named
    Docker volume (tour-of-heroes-sql-data), so the database survives
    stopping/removing and recreating the container. Intended for local
    development only — uses a fixed, non-production SA password.

.EXAMPLE
    ./start-sql-server.ps1
#>

$ErrorActionPreference = 'Stop'

$containerName = 'tour-of-heroes-sql'
$volumeName = 'tour-of-heroes-sql-data'
$saPassword = 'YourStrong!Passw0rd'
$hostPort = 1433

$existingVolume = docker volume ls --filter "name=^$volumeName$" --format '{{.Name}}'
if ($existingVolume -ne $volumeName) {
    Write-Host "Creating volume '$volumeName'..."
    docker volume create $volumeName | Out-Null
}

$existing = docker ps -a --filter "name=^/$containerName$" --format '{{.Names}}'
if ($existing -eq $containerName) {
    Write-Host "Container '$containerName' already exists. Starting it..."
    docker start $containerName | Out-Null
}
else {
    Write-Host "Creating and starting container '$containerName'..."
    docker run -d `
        --name $containerName `
        -e "ACCEPT_EULA=Y" `
        -e "MSSQL_SA_PASSWORD=$saPassword" `
        -p "${hostPort}:1433" `
        -v "${volumeName}:/var/opt/mssql" `
        mcr.microsoft.com/mssql/server:2022-latest | Out-Null
}

Write-Host "SQL Server container '$containerName' is starting on localhost,$hostPort."
Write-Host "Connection string:"
Write-Host "Server=localhost,$hostPort;Database=HeroesDb;User Id=sa;Password=$saPassword;TrustServerCertificate=True;"
Write-Host ""
Write-Host "It may take ~10-20 seconds for SQL Server to be ready to accept connections."
