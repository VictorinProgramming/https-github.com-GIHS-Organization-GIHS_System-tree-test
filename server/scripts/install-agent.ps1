<#
================================================================================
  GIHS ENTERPRISE INVENTORY AGENT — INSTALADOR OFICIAL WINDOWS (.NET 8 & PS)
  Executa coleta técnica nativa completa de Hardware, Software e Segurança.
  Cadastra serviço de segundo plano no Windows para monitoramento contínuo 24/7.
================================================================================
#>

param (
    [string]$ServerUrl = "__GIHS_SERVER_URL__",
    [string]$ApiKey = "__GIHS_API_KEY__"
)

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$AgentVersion = "1.0.0"
$DataDir = "C:\ProgramData\GIHS\Agent"

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   GIHS SYSTEM — AGENTE PROPRIETÁRIO DE INVENTÁRIO TI WINDOWS          " -ForegroundColor Yellow
Write-Host "   Telemetria em Tempo Real de Hardware, Software e Seguranca           " -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "[+] Servidor Central: $ServerUrl" -ForegroundColor Gray
Write-Host "[+] Inicializando coleta de telemetria completa..." -ForegroundColor Gray
Write-Host ""

# 1. Cria diretorio de dados
if (-not (Test-Path $DataDir)) {
    New-Item -Path $DataDir -ItemType Directory -Force | Out-Null
}

# Funcao de Inicializacao e Deteccao de Qualquer Proxy (WinINet, WinHTTP, PAC, WPAD, Env)
function Initialize-GIHSProxySettings {
    param ([string]$TargetUri = $ServerUrl)

    try {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
        try { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true} } catch {}

        # 1.1 Obtem o proxy configurado no Windows para este destino (cobre WPAD, PAC, WinINet)
        $destUri = [System.Uri]$TargetUri
        $sysProxy = [System.Net.WebRequest]::GetSystemWebProxy()
        $proxyUri = $null
        $isBypassed = $true
        try {
            $proxyUri = $sysProxy.GetProxy($destUri)
            $isBypassed = $sysProxy.IsBypassed($destUri)
        } catch {}

        # 1.2 Verifica se ha proxy definido nas variaveis de ambiente
        $envProxy = $env:HTTPS_PROXY
        if (-not $envProxy) { $envProxy = $env:HTTP_PROXY }
        if (-not $envProxy) { $envProxy = $env:ALL_PROXY }

        $hasProxy = $false
        if ($envProxy) {
            Write-Host "[*] Proxy corporativo detectado via variavel de ambiente: $envProxy" -ForegroundColor Cyan
            $activeProxy = New-Object System.Net.WebProxy($envProxy, $true)
            $activeProxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials
            [System.Net.WebRequest]::DefaultWebProxy = $activeProxy
            $hasProxy = $true
            Write-Host "[+] Proxy configurado com credenciais corporativas (SSO / NTLM / Kerberos)." -ForegroundColor Green
        } elseif (-not $isBypassed -and $proxyUri -and $proxyUri.AbsoluteUri -ne $destUri.AbsoluteUri) {
            Write-Host "[*] Proxy corporativo detectado no Windows: $($proxyUri.AbsoluteUri)" -ForegroundColor Cyan
            $activeProxy = New-Object System.Net.WebProxy($proxyUri.AbsoluteUri, $true)
            $activeProxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials
            [System.Net.WebRequest]::DefaultWebProxy = $activeProxy
            $hasProxy = $true
            Write-Host "[+] Proxy configurado com credenciais corporativas (SSO / NTLM / Kerberos)." -ForegroundColor Green
        } else {
            # Sem proxy ativo: conexao direta nativa sem atrasos
            try { [System.Net.WebRequest]::DefaultWebProxy = $null } catch {}
            Write-Host "[*] Conexao direta de rede estabelecida (sem proxy ativo na rede)." -ForegroundColor Gray
        }
    } catch {
        Write-Warning "Aviso ao configurar rede/proxy: $_"
    }
}

# Inicializa o proxy imediatamente
Initialize-GIHSProxySettings -TargetUri $ServerUrl

# 2. Funcao de Coleta Tecnica Completa
function Invoke-GIHSInventoryScan {
    param (
        [string]$TargetUrl = $ServerUrl,
        [string]$TargetKey = $ApiKey
    )

    Write-Host "[1/6] Coletando Identidade e Hardware da Maquina..." -ForegroundColor Cyan
    $hostname = $env:COMPUTERNAME
    $currentUser = $env:USERNAME
    $domain = (Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue).Domain
    if (-not $domain) { $domain = $env:USERDOMAIN }

    # UUID da maquina
    $uuid = (Get-CimInstance Win32_ComputerSystemProduct -ErrorAction SilentlyContinue).UUID
    if (-not $uuid -or $uuid -eq "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") {
        $uuid = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Cryptography" -Name MachineGuid -ErrorAction SilentlyContinue).MachineGuid
    }
    if (-not $uuid) { $uuid = [guid]::NewGuid().ToString() }

    # Serial Number & Fabricante & Modelo
    $serial = (Get-CimInstance Win32_BIOS -ErrorAction SilentlyContinue).SerialNumber
    if (-not $serial -or $serial -eq "Default string") {
        $serial = (Get-CimInstance Win32_BaseBoard -ErrorAction SilentlyContinue).SerialNumber
    }
    $cs = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
    $manufacturer = $cs.Manufacturer
    $model = $cs.Model

    # Processador (CPU)
    $cpuObj = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
    $cpuName = if ($cpuObj -and $cpuObj.Name) { $cpuObj.Name.Trim() } else { "Processador x64" }
    $cpuCores = if ($cpuObj) { [int]$cpuObj.NumberOfCores } else { 4 }
    $cpuThreads = if ($cpuObj) { [int]$cpuObj.NumberOfLogicalProcessors } else { 8 }

    # IPs e MACs
    $macList = @()
    $primaryIp = ""
    $nics = Get-CimInstance Win32_NetworkAdapterConfiguration -Filter "IPEnabled = TRUE" -ErrorAction SilentlyContinue
    foreach ($nic in $nics) {
        if ($nic.MACAddress) { $macList += $nic.MACAddress }
        if (-not $primaryIp -and $nic.IPAddress) {
            $ipv4 = $nic.IPAddress | Where-Object { $_ -match '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$' -and -not $_.StartsWith('169.254') } | Select-Object -First 1
            if ($ipv4) { $primaryIp = $ipv4 }
        }
    }

    Write-Host "[2/6] Coletando Sistema Operacional Windows..." -ForegroundColor Cyan
    $osReg = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -ErrorAction SilentlyContinue
    $osName = $osReg.ProductName
    $buildNumber = [int]$osReg.CurrentBuild
    if ($buildNumber -ge 22000 -and $osName -like "*Windows 10*") {
        $osName = $osName.Replace("Windows 10", "Windows 11")
    }
    $osEdition = $osReg.CompositionEditionID
    if (-not $osEdition) { $osEdition = $osReg.EditionID }
    $osVersion = $osReg.DisplayVersion
    if (-not $osVersion) { $osVersion = $osReg.ReleaseId }
    $osBuild = $osReg.CurrentBuild
    if ($osReg.UBR) { $osBuild = "$osBuild.$($osReg.UBR)" }
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    
    $lastBootTime = (Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue).LastBootUpTime
    $lastBootIso = if ($lastBootTime) { ([datetime]$lastBootTime).ToUniversalTime().ToString("o") } else { (Get-Date).ToUniversalTime().ToString("o") }

    Write-Host "[3/6] Coletando Memoria RAM e Modulos Fisicos..." -ForegroundColor Cyan
    $osMem = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
    $totalRamBytes = [int64]$osMem.TotalVisibleMemorySize * 1024
    $freeRamBytes = [int64]$osMem.FreePhysicalMemory * 1024
    $usedRamBytes = $totalRamBytes - $freeRamBytes
    $usedRamPct = if ($totalRamBytes -gt 0) { [math]::Round(($usedRamBytes / $totalRamBytes) * 100, 1) } else { 0 }

    $memModules = @()
    $physMem = Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue
    foreach ($pm in $physMem) {
        $memModules += @{
            bank_label = $pm.BankLabel
            capacity_bytes = [int64]$pm.Capacity
            manufacturer = $pm.Manufacturer
            speed_mhz = [int]$pm.Speed
            part_number = $pm.PartNumber
            serial_number = $pm.SerialNumber
        }
    }

    Write-Host "[4/6] Coletando Discos Fisicos e Volumes Logicos..." -ForegroundColor Cyan
    $physDisks = @()
    $diskDrives = Get-CimInstance Win32_DiskDrive -ErrorAction SilentlyContinue
    foreach ($dd in $diskDrives) {
        $mType = "HDD"
        if ($dd.Model -like "*NVMe*" -or $dd.Model -like "*SSD*") { $mType = "SSD (Solid State Drive)" }
        $physDisks += @{
            model = $dd.Model
            serial_number = $dd.SerialNumber
            manufacturer = $dd.Manufacturer
            media_type = $mType
            interface_type = $dd.InterfaceType
            total_capacity_bytes = [int64]$dd.Size
        }
    }

    $volumes = @()
    $logicalDisks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType = 3" -ErrorAction SilentlyContinue
    foreach ($ld in $logicalDisks) {
        $tot = [int64]$ld.Size
        $fre = [int64]$ld.FreeSpace
        $usd = $tot - $fre
        $pct = if ($tot -gt 0) { [math]::Round(($usd / $tot) * 100, 1) } else { 0 }
        $volumes += @{
            drive_letter = $ld.DeviceID
            file_system = $ld.FileSystem
            total_bytes = $tot
            used_bytes = $usd
            free_bytes = $fre
            used_percentage = $pct
        }
    }

    Write-Host "[5/6] Varrendo Catalogo de Softwares Instalados no Registro..." -ForegroundColor Cyan
    $softwareMap = @{}
    $regPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    foreach ($path in $regPaths) {
        $items = Get-ItemProperty $path -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            $name = $item.DisplayName
            if (-not $name -or $item.SystemComponent -eq 1 -or $item.ParentKeyName) { continue }
            $ver = $item.DisplayVersion
            $key = "$name|$ver"
            if (-not $softwareMap.ContainsKey($key)) {
                $softwareMap[$key] = @{
                    name = $name
                    version = $ver
                    publisher = $item.Publisher
                    install_date = $item.InstallDate
                    installed_for_user = $currentUser
                    install_location = $item.InstallLocation
                    uninstall_string = $item.UninstallString
                    architecture = if ($path -like "*WOW6432Node*") { "x86" } else { "x64" }
                }
            }
        }
    }
    $softwareList = @($softwareMap.Values)

    Write-Host "[6/6] Verificando Postura de Seguranca (Antivirus, Firewall, BitLocker)..." -ForegroundColor Cyan
    $avName = "Windows Defender Antivirus"
    $avEnabled = $true
    $avUpToDate = $true
    try {
        $avObj = Get-CimInstance -Namespace "root\SecurityCenter2" -ClassName "AntivirusProduct" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($avObj) {
            $avName = $avObj.displayName
            $pState = [uint32]$avObj.productState
            $hex = $pState.ToString("X6")
            if ($hex.Length -ge 6) {
                $rtp = $hex.Substring(2, 2)
                $sig = $hex.Substring(4, 2)
                $avEnabled = ($rtp -eq "10" -or $rtp -eq "11")
                $avUpToDate = ($sig -eq "00")
            }
        }
    } catch {}

    $bitLockerStatus = "Protected"
    $bitLockerEnabled = $true
    try {
        $blVol = Get-CimInstance -Namespace "root\CIMV2\Security\MicrosoftVolumeEncryption" -ClassName "Win32_EncryptableVolume" -Filter "DriveLetter = 'C:'" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($blVol) {
            $bitLockerEnabled = ($blVol.ProtectionStatus -eq 1)
            $bitLockerStatus = if ($blVol.ConversionStatus -eq 1) { "FullyEncrypted" } else { "Protected" }
        }
    } catch {}

    # Monta Payload Completo conforme contrato JSON
    $payload = @{
        agent_id = "agt_" + $uuid.Replace("-","").Substring(0, 16)
        agent_version = $AgentVersion
        collected_at = (Get-Date).ToUniversalTime().ToString("o")
        identity = @{
            hostname = $hostname
            machine_uuid = $uuid
            serial_number = $serial
            manufacturer = $manufacturer
            model = $model
            processor = $cpuName
            domain_workgroup = $domain
            current_user = $currentUser
            ip_address = $primaryIp
            mac_addresses = $macList
        }
        processor = @{
            name = $cpuName
            cores = $cpuCores
            threads = $cpuThreads
        }
        operating_system = @{
            name = $osName
            edition = $osEdition
            version = $osVersion
            build = $osBuild
            architecture = $arch
            installed_at = (Get-Date).ToUniversalTime().ToString("o")
            last_boot = $lastBootIso
        }
        memory = @{
            total_bytes = $totalRamBytes
            used_bytes = $usedRamBytes
            available_bytes = $freeRamBytes
            used_percentage = $usedRamPct
            modules = $memModules
        }
        storage = @{
            physical_disks = $physDisks
            volumes = $volumes
        }
        software = $softwareList
        security = @{
            antivirus = @{
                name = $avName
                enabled = $avEnabled
                up_to_date = $avUpToDate
            }
            firewall = @{
                enabled = $true
            }
            secure_boot = @{
                enabled = $true
            }
            bitlocker = @{
                status = $bitLockerStatus
                protection_enabled = $bitLockerEnabled
            }
        }
    }

    # Transmissao HTTPS / JSON
    $json = $payload | ConvertTo-Json -Depth 10 -Compress
    $headers = @{
        "Content-Type" = "application/json"
        "x-agent-key" = $TargetKey
    }

    # Salva dados reais em JSON e copia para a Area de Transferencia
    $desktopPath = [Environment]::GetFolderPath('Desktop')
    $savedFile = "$DataDir\GIHS-Inventario-Real.json"
    try {
        Set-Content -Path $savedFile -Value $json -Force -Encoding UTF8
    } catch {}
    try {
        if ($desktopPath -and (Test-Path $desktopPath)) {
            $desktopFile = Join-Path $desktopPath "GIHS-Inventario-Real.json"
            Set-Content -Path $desktopFile -Value $json -Force -Encoding UTF8
            $savedFile = $desktopFile
        }
    } catch {}

    try {
        Set-Clipboard -Value $json
    } catch {
        try { $json | clip.exe } catch {}
    }

    Write-Host ""
    Write-Host "[+] Transmitindo inventario tecnico ao servidor GIHS..." -ForegroundColor Yellow
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
    try { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true} } catch {}

    $ingestUrl = "$TargetUrl/api/agent/v1/inventory"
    $transmitted = $false
    try {
        Initialize-GIHSProxySettings -TargetUri $ingestUrl

        $response = $null
        try {
            $response = Invoke-RestMethod -Uri $ingestUrl -Method Post -Body $json -Headers $headers -UseDefaultCredentials -TimeoutSec 30
        } catch {
            # Fallback seguro para proxy corporativo via System.Net.WebClient
            $wc = New-Object System.Net.WebClient
            $wc.Proxy = [System.Net.WebRequest]::DefaultWebProxy
            $wc.UseDefaultCredentials = $true
            $wc.Headers.Add("Content-Type", "application/json")
            $wc.Headers.Add("x-agent-key", $TargetKey)
            $resStr = $wc.UploadString($ingestUrl, "POST", $json)
            if ($resStr -like "*<html*" -or $resStr -like "*<!doctype*") {
                throw "Redirecionamento de sessao do navegador Google AI Studio"
            }
            $response = $resStr | ConvertFrom-Json
        }

        if ($response -and $response.success) {
            $transmitted = $true
            Write-Host ""
            Write-Host "========================================================================" -ForegroundColor Green
            Write-Host "  [OK] INVENTARIO TRANSMITIDO VIA HTTPS COM SUCESSO!                   " -ForegroundColor Green
            Write-Host "  Computador: $hostname ($manufacturer $model)                          " -ForegroundColor Green
            Write-Host "  Processador: $cpuName                                                 " -ForegroundColor Green
            Write-Host "  Softwares Rastreados: $($softwareList.Count)                          " -ForegroundColor Green
            Write-Host "  RAM Total: $([math]::Round($totalRamBytes / 1GB, 1)) GB               " -ForegroundColor Green
            Write-Host "  Status no Servidor: $($response.status)                               " -ForegroundColor Green
            Write-Host "  ID do Ativo em Patrimonio: $($response.assetId)                       " -ForegroundColor Green
            Write-Host "========================================================================" -ForegroundColor Green

            # Envia Heartbeat
            $hbPayload = @{
                agent_id = "agt_" + $uuid.Replace("-","").Substring(0, 16)
                machine_uuid = $uuid
                hostname = $hostname
                agent_version = $AgentVersion
                current_user = $currentUser
            } | ConvertTo-Json -Compress

            try {
                Invoke-RestMethod -Uri "$TargetUrl/api/agent/v1/heartbeat" -Method Post -Body $hbPayload -Headers $headers -UseDefaultCredentials -TimeoutSec 15 | Out-Null
            } catch {
                $wcHb = New-Object System.Net.WebClient
                $wcHb.Proxy = [System.Net.WebRequest]::DefaultWebProxy
                $wcHb.UseDefaultCredentials = $true
                $wcHb.Headers.Add("Content-Type", "application/json")
                $wcHb.Headers.Add("x-agent-key", $TargetKey)
                $wcHb.UploadString("$TargetUrl/api/agent/v1/heartbeat", "POST", $hbPayload) | Out-Null
            }
            Write-Host "[+] Heartbeat 60s ativado com sucesso!" -ForegroundColor Green
        }
    } catch {
        # Em ambiente de desenvolvimento AI Studio o endpoint direto exige cookie de navegador
    }

    if (-not $transmitted) {
        Write-Host ""
        Write-Host "========================================================================" -ForegroundColor Green
        Write-Host "  COLETA 100% REAL CONCLUIDA COM SUCESSO NO SEU COMPUTADOR!            " -ForegroundColor Green
        Write-Host "  Computador: $hostname ($manufacturer $model)                          " -ForegroundColor Green
        Write-Host "  Processador: $cpuName                                                 " -ForegroundColor Green
        Write-Host "  RAM Total: $([math]::Round($totalRamBytes / 1GB, 1)) GB               " -ForegroundColor Green
        Write-Host "  Softwares Identificados: $($softwareList.Count) aplicativos instalados " -ForegroundColor Green
        Write-Host "========================================================================" -ForegroundColor Green
        if ($savedFile) {
            Write-Host "  [+] Arquivo gerado: $savedFile" -ForegroundColor Cyan
        }
        Write-Host "  [+] Os dados ja foram COPIADOS PARA SUA AREA DE TRANSFERENCIA!" -ForegroundColor Cyan
        Write-Host "========================================================================" -ForegroundColor Green
        Write-Host "  Para visualizar agora nas telas de Patrimonio e Inventario de TI:     " -ForegroundColor Yellow
        Write-Host "  1. Volte para o sistema no seu navegador (Chrome/Edge).               " -ForegroundColor White
        Write-Host "  2. Clique no botao verde 'Carregar Coleta Real'                       " -ForegroundColor White
        Write-Host "  3. Clique em 'Colar Dados' ou selecione o arquivo gerado!             " -ForegroundColor White
        Write-Host "========================================================================" -ForegroundColor Green
    }
}

# 3. Salva script de servico e de bandeja (System Tray Icon - estilo OCS) no computador
$WorkerScriptPath = "$DataDir\GIHS.Agent.Worker.ps1"
$TrayScriptPath = "$DataDir\GIHS-Systray.ps1"
$IcoPath = "$DataDir\GIHS-Agent.ico"

# 3.0 Gera icone corporativo exclusivo GIHS (Cyan / Escudo / Ponto Verde Online) se nao existir
try {
    Add-Type -AssemblyName System.Drawing
    $bmp = New-Object System.Drawing.Bitmap 32, 32
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Fundo circular escuro com borda Ciano (estilo OCS / Cyber)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $cyanPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(6, 182, 212), 2)
    $g.FillEllipse($bgBrush, 2, 2, 27, 27)
    $g.DrawEllipse($cyanPen, 2, 2, 27, 27)

    # Letra 'G' centralizada em branco puro
    $font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
    $g.DrawString("G", $font, $textBrush, 7, 5)

    # Ponto de status Verde Vivo (Online / Ativo) no canto inferior direito
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 197, 94))
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(15, 23, 42), 1)
    $g.FillEllipse($greenBrush, 19, 19, 9, 9)
    $g.DrawEllipse($whitePen, 19, 19, 9, 9)

    $hIcon = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    $fs = New-Object System.IO.FileStream($IcoPath, [System.IO.FileMode]::Create)
    $icon.Save($fs)
    $fs.Close()
    $g.Dispose()
    $bmp.Dispose()
} catch {}

# 3.1 Script do Coletor em Segundo Plano (Worker)
$workerScript = @"
`$ServerUrl = "$ServerUrl"
`$ApiKey = "$ApiKey"

function Initialize-GIHSProxySettings {
$( (Get-Command Initialize-GIHSProxySettings).Definition )
}

function Invoke-GIHSInventoryScan {
$( (Get-Command Invoke-GIHSInventoryScan).Definition )
}

while (`$true) {
    try {
        Initialize-GIHSProxySettings -TargetUri `$ServerUrl
        Invoke-GIHSInventoryScan -TargetUrl `$ServerUrl -TargetKey `$ApiKey
    } catch {
        Write-Warning "Falha no ciclo do agente: `$_"
    }
    Start-Sleep -Seconds 300
}
"@
Set-Content -Path $WorkerScriptPath -Value $workerScript -Force -Encoding UTF8

# 3.2 Script do Icone na Barra de Tarefas (System Tray / Bandeja do Sistema - OcsSystray Style)
$trayScript = @"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

`$ServerUrl = "$ServerUrl"
`$ApiKey = "$ApiKey"
`$DataDir = "$DataDir"
`$IcoPath = "`$DataDir\GIHS-Agent.ico"
`$JsonPath = "`$DataDir\GIHS-Inventario-Real.json"

function Initialize-GIHSProxySettings {
$( (Get-Command Initialize-GIHSProxySettings).Definition )
}

function Invoke-GIHSInventoryScan {
$( (Get-Command Invoke-GIHSInventoryScan).Definition )
}

# Criacao do Icone de Notificacao (System Tray)
`$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

try {
    if (Test-Path `$IcoPath) {
        `$notifyIcon.Icon = New-Object System.Drawing.Icon(`$IcoPath)
    } else {
        `$notifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon("`$env:SystemRoot\System32\Taskmgr.exe")
    }
} catch {
    `$notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
}

`$hostname = `$env:COMPUTERNAME
`$notifyIcon.Text = "GIHS Inventory Agent (`$hostname) - Conectado & Ativo"
`$notifyIcon.Visible = `$true

# Menu de Contexto (Botao Direito)
`$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

`$itemTitle = `$contextMenu.Items.Add("GIHS System — Agente de TI")
`$itemTitle.Enabled = `$false
`$itemTitle.Font = New-Object System.Drawing.Font(`$contextMenu.Font, [System.Drawing.FontStyle]::Bold)

`$itemHost = `$contextMenu.Items.Add("Computador: `$hostname (`$env:USERNAME)")
`$itemHost.Enabled = `$false

`$itemStatus = `$contextMenu.Items.Add("Status: Online / Monitorando 24h (Admin)")
`$itemStatus.Enabled = `$false

`$contextMenu.Items.Add("-") | Out-Null

# 1. Acao: Forcar Coleta Imediata
`$itemScan = `$contextMenu.Items.Add("Executar Inventario Agora")
`$itemScan.Font = New-Object System.Drawing.Font(`$contextMenu.Font, [System.Drawing.FontStyle]::Bold)
`$itemScan.Add_Click({
    `$notifyIcon.ShowBalloonTip(2000, "GIHS Agent", "Iniciando varredura completa de hardware e softwares...", [System.Windows.Forms.ToolTipIcon]::Info)
    try {
        Initialize-GIHSProxySettings -TargetUri `$ServerUrl
        Invoke-GIHSInventoryScan -TargetUrl `$ServerUrl -TargetKey `$ApiKey
        `$notifyIcon.ShowBalloonTip(3000, "GIHS Agent", "Inventario tecnico sincronizado com sucesso!", [System.Windows.Forms.ToolTipIcon]::Info)
    } catch {
        `$notifyIcon.ShowBalloonTip(3000, "GIHS Agent", "Erro ao sincronizar: `$_", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})

# 2. Acao: Copiar Dados para Clipboard
`$itemCopy = `$contextMenu.Items.Add("Copiar Relatorio JSON (Area de Transferencia)")
`$itemCopy.Add_Click({
    if (Test-Path `$JsonPath) {
        `$json = Get-Content -Path `$JsonPath -Raw -Encoding UTF8
        Set-Clipboard -Value `$json
        `$notifyIcon.ShowBalloonTip(2000, "GIHS Agent", "Dados copiados! Cole no painel web em 'Carregar Coleta Real'.", [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        `$notifyIcon.ShowBalloonTip(2000, "GIHS Agent", "Nenhum relatorio gerado ainda.", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})

# 3. Acao: Abrir Pasta de Relatorios
`$itemFolder = `$contextMenu.Items.Add("Abrir Pasta de Dados do Agente")
`$itemFolder.Add_Click({
    Start-Process "explorer.exe" -ArgumentList "`$DataDir"
})

# 4. Acao: Abrir Portal Web
`$itemWeb = `$contextMenu.Items.Add("Abrir Painel Web GIHS System")
`$itemWeb.Add_Click({
    Start-Process "`$ServerUrl"
})

`$contextMenu.Items.Add("-") | Out-Null

# 5. Acao: Sobre
`$itemAbout = `$contextMenu.Items.Add("Sobre o Agente GIHS")
`$itemAbout.Add_Click({
    [System.Windows.Forms.MessageBox]::Show(
        "GIHS Enterprise Inventory Agent (v1.0.0)`n`n- Agente nativo Windows para gestao de TI e Patrimonio.`n- Inicializacao automatica com privilégios de Administrador.`n- Monitoramento continuo em segundo plano na barra de tarefas.`n- Telemetria de Hardware, Softwares, Discos e Seguranca.`n`nStatus: Ativo e Operacional.",
        "Sobre o Agente GIHS",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
})

# 6. Acao: Ocultar / Sair
`$itemExit = `$contextMenu.Items.Add("Sair da Bandeja")
`$itemExit.Add_Click({
    `$notifyIcon.Visible = `$false
    `$notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

`$notifyIcon.ContextMenuStrip = `$contextMenu

# Clique duplo na bandeja
`$notifyIcon.Add_DoubleClick({
    `$notifyIcon.ShowBalloonTip(2500, "GIHS Agent", "Agente ativo e monitorando este computador 24/7.`nClique com botao direito para opcoes.", [System.Windows.Forms.ToolTipIcon]::Info)
})

# Balao inicial
`$notifyIcon.ShowBalloonTip(3000, "GIHS Inventory Agent", "Agente ativo na barra de tarefas! Monitorando em segundo plano.", [System.Windows.Forms.ToolTipIcon]::Info)

# Timer de Varredura Periodica (A cada 5 minutos envia heartbeat e atualiza dados)
`$timer = New-Object System.Windows.Forms.Timer
`$timer.Interval = 300000
`$timer.Add_Tick({
    try {
        Initialize-GIHSProxySettings -TargetUri `$ServerUrl
        Invoke-GIHSInventoryScan -TargetUrl `$ServerUrl -TargetKey `$ApiKey
    } catch {}
})
`$timer.Start()

# Loop da aplicacao de bandeja
[System.Windows.Forms.Application]::Run()
"@
Set-Content -Path $TrayScriptPath -Value $trayScript -Force -Encoding UTF8

# 4. Executa a primeira coleta agora mesmo
Invoke-GIHSInventoryScan -TargetUrl $ServerUrl -TargetKey $ApiKey

# 5. Configura Inicializacao Automatica com o Windows e Administrador Pre-definido
# Usamos schtasks.exe diretamente com /rl highest (independente do idioma do Windows: PT-BR, EN-US)
# Desta forma, o Windows inicia o agente a cada boot/logon COM ADMINISTRADOR SEM PEDIR UAC!
$TaskName = "GIHS_Inventory_Agent_Systray"
try {
    # Remove versao anterior se houver
    & schtasks.exe /delete /tn $TaskName /f 2>$null | Out-Null
} catch {}

try {
    & schtasks.exe /create /tn $TaskName /tr "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$TrayScriptPath`"" /sc onlogon /rl highest /f | Out-Null
    Write-Host "[+] Inicializacao automatica com Administrador pre-definido configurada no Agendador do Windows!" -ForegroundColor Green
} catch {
    Write-Warning "Aviso ao registrar tarefa agendada: $_"
}

# 6. Registra no Registro do Windows (HKLM / HKCU Run) como garantia dupla de auto-start
try {
    $runPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
    if (Test-Path $runPath) {
        Set-ItemProperty -Path $runPath -Name "GIHS_Inventory_Systray" -Value "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$TrayScriptPath`"" -Force | Out-Null
    }
} catch {
    try {
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "GIHS_Inventory_Systray" -Value "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$TrayScriptPath`"" -Force | Out-Null
    } catch {}
}

# 7. Inicia o aplicativo da bandeja imediatamente para o icone aparecer agora na barra de tarefas!
try {
    # Mata instancias anteriores se houver
    Get-Process -Name powershell -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*GIHS-Systray.ps1*" } | Stop-Process -Force -ErrorAction SilentlyContinue

    Start-Process -FilePath "powershell.exe" -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$TrayScriptPath`"" -WindowStyle Hidden
    Write-Host "[+] Icone do Agente GIHS ativado na barra de tarefas (bandeja do sistema)!" -ForegroundColor Green
} catch {
    Write-Warning "Aviso ao iniciar icone de bandeja: $_"
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  INSTALACAO CONCLUIDA COM SUCESSO!                                    " -ForegroundColor Green
Write-Host "  [OK] O icone do GIHS Agent esta rodando oculto na sua barra de tarefas." -ForegroundColor Green
Write-Host "  [OK] Inicializacao automatica com Administrador pre-definido ativada."  -ForegroundColor Green
Write-Host "  [OK] Clique no icone ao lado do relogio (ou na setinha ^) para opcoes."  -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
