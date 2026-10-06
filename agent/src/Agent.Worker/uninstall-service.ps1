<#
.SYNOPSIS
    Desinstalação do Serviço do Agente de Inventário GIHS
#>

[CmdletBinding()]
param (
    [string]$ServiceName = "GIHS_Inventory_Agent"
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Este script precisa ser executado como Administrador."
    exit 1
}

Write-Host "Desinstalando serviço $ServiceName..." -ForegroundColor Yellow
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svc) {
    if ($svc.Status -eq 'Running') {
        Stop-Service -Name $ServiceName -Force
    }
    sc.exe delete $ServiceName
    Write-Host "Serviço $ServiceName removido com sucesso." -ForegroundColor Green
} else {
    Write-Host "Serviço $ServiceName não encontrado." -ForegroundColor Gray
}
