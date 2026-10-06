<#
.SYNOPSIS
    Instalação Oficial do Agente de Inventário GIHS como Serviço do Windows (Windows Service)
.DESCRIPTION
    Script PowerShell corporativo para registro, provisionamento de pastas e inicialização do serviço.
    Requisitos: Windows 10/11 x64, privilégios de Administrador.
#>

[CmdletBinding()]
param (
    [string]$ServiceName = "GIHS_Inventory_Agent",
    [string]$DisplayName = "GIHS Enterprise Inventory Agent Service",
    [string]$Description = "Serviço de Coleta e Inventário Automatizado de Hardware, Software e Segurança GIHS System",
    [string]$ServerUrl = "http://localhost:3000",
    [string]$ApiKey = "GIHS-AGENT-SECURE-KEY-2026-ENTERPRISE"
)

# Verifica se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Este script precisa ser executado como Administrador. Abra o PowerShell como Administrador e tente novamente."
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  GIHS SYSTEM — INSTALAÇÃO DO AGENTE DE INVENTÁRIO TI       " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ExePath = Join-Path $ScriptDir "GIHS.Agent.Worker.exe"

if (-not (Test-Path $ExePath)) {
    # Procura na pasta de publicação Release ou Debug
    $Candidate = Get-ChildItem -Path $ScriptDir -Recurse -Filter "GIHS.Agent.Worker.exe" | Select-Object -First 1
    if ($Candidate) {
        $ExePath = $Candidate.FullName
    } else {
        Write-Error "Executável GIHS.Agent.Worker.exe não encontrado em $ScriptDir. Execute 'dotnet publish -c Release' primeiro."
        exit 1
    }
}

Write-Host "Local do executável: $ExePath" -ForegroundColor Gray

# Cria pasta de dados segura no ProgramData
$DataDir = "C:\ProgramData\GIHS\Agent"
if (-not (Test-Path $DataDir)) {
    New-Item -Path $DataDir -ItemType Directory -Force | Out-Null
    Write-Host "Diretório de dados criado em $DataDir" -ForegroundColor Green
}

# Atualiza appsettings.json com os parâmetros
$ConfigFile = Join-Path (Split-Path $ExePath) "appsettings.json"
if (Test-Path $ConfigFile) {
    try {
        $json = Get-Content $ConfigFile -Raw | ConvertFrom-Json
        $json.GIHS_Agent.ServerBaseUrl = $ServerUrl
        $json.GIHS_Agent.AgentApiKey = $ApiKey
        $json.GIHS_Agent.OfflineDatabasePath = "$DataDir\offline_queue.db"
        $json | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile -Force
        Write-Host "Arquivo appsettings.json configurado com sucesso." -ForegroundColor Green
    } catch {
        Write-Warning "Não foi possível atualizar o appsettings.json: $_"
    }
}

# Para e remove serviço anterior se já existir
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Removendo versão anterior do serviço $ServiceName..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
}

# Registra o novo serviço do Windows
Write-Host "Registrando Serviço do Windows..." -ForegroundColor Cyan
New-Service -Name $ServiceName `
            -BinaryPathName "`"$ExePath`"" `
            -DisplayName $DisplayName `
            -Description $Description `
            -StartupType Automatic

# Configura recuperação automática em caso de falha (Restart após 1 minuto)
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null

# Inicia o serviço
Write-Host "Iniciando $DisplayName..." -ForegroundColor Cyan
Start-Service -Name $ServiceName

$svc = Get-Service -Name $ServiceName
if ($svc.Status -eq 'Running') {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  AGENTE INSTALADO E EM EXECUÇÃO CONTÍNUA COM SUCESSO!     " -ForegroundColor Green
    Write-Host "  Status: $($svc.Status)                                     " -ForegroundColor Green
    Write-Host "  Servidor: $ServerUrl                                      " -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Warning "O serviço foi instalado, mas o status atual é: $($svc.Status)"
}
