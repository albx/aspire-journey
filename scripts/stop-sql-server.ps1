<#
.SYNOPSIS
    Stops and removes the local Tour of Heroes SQL Server container.

.DESCRIPTION
    Stops and removes the Docker container created by start-sql-server.ps1.
    Data is kept in the 'tour-of-heroes-sql-data' named volume and survives
    by default. Pass -RemoveVolume to also delete the volume (permanently
    erasing the database).

.PARAMETER RemoveVolume
    Also removes the 'tour-of-heroes-sql-data' volume, deleting all data.

.EXAMPLE
    ./stop-sql-server.ps1

.EXAMPLE
    ./stop-sql-server.ps1 -RemoveVolume
#>

param(
    [switch]$RemoveVolume
)

$ErrorActionPreference = 'Stop'

$containerName = 'tour-of-heroes-sql'
$volumeName = 'tour-of-heroes-sql-data'

$existing = docker ps -a --filter "name=^/$containerName$" --format '{{.Names}}'
if ($existing -eq $containerName) {
    Write-Host "Stopping container '$containerName'..."
    docker stop $containerName | Out-Null
    Write-Host "Removing container '$containerName'..."
    docker rm $containerName | Out-Null
    Write-Host "Container '$containerName' stopped and removed."
}
else {
    Write-Host "Container '$containerName' does not exist. Nothing to do."
}

if ($RemoveVolume) {
    $existingVolume = docker volume ls --filter "name=^$volumeName$" --format '{{.Name}}'
    if ($existingVolume -eq $volumeName) {
        Write-Host "Removing volume '$volumeName'..."
        docker volume rm $volumeName | Out-Null
        Write-Host "Volume '$volumeName' removed. Database data has been deleted."
    }
    else {
        Write-Host "Volume '$volumeName' does not exist. Nothing to do."
    }
}
else {
    Write-Host "Volume '$volumeName' was kept. Re-run start-sql-server.ps1 to reuse the same data."
}
