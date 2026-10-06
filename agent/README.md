# GIHS Enterprise Windows Inventory Agent (C# .NET 8 LTS)

Módulo oficial de inventário automatizado de computadores Windows corporativos integrado à plataforma **GIHS System** e persistido diretamente no **PostgreSQL**.

---

## 🏛️ Arquitetura Obrigatória

Conforme as diretrizes de governança e segurança do GIHS:

```text
Computador Windows (10/11 x64)
            ↓
  GIHS.Agent.Worker.exe (Windows Service)
            ↓
  Coleta Técnica Independente (WMI, Registry, Win32 API, DriveInfo)
            ↓
  Normalização & Deduplicação
            ↓
  HTTPS / JSON (System.Text.Json) + Chave de Agente
            ↓
  Backend GIHS (Express / Node.js API)
            ↓
  PostgreSQL (gihs_core.inventory_agents & gihs_core.equipment)
            ↓
  Tela Administrativa Exclusiva SUPER_ADMIN
```

> ⚠️ **Princípio Arquitetural Mandatório**: O agente **NUNCA** acessa diretamente o PostgreSQL. Toda e qualquer comunicação é intermediada pela API Backend via HTTPS com payload estruturado e autenticado.

---

## 📁 Estrutura Modular da Solução (`GIHS.Agent.sln`)

```text
agent/
│
├── GIHS.Agent.sln
├── README.md
│
├── src/
│   ├── Agent.Core/                     # DTOs, Contratos, Interfaces e Modelos de Dados
│   │   ├── Models/AgentModels.cs       # Identity, OS, Memory, Storage, Software, Security
│   │   └── Interfaces/ICollectors.cs   # Interfaces segregadas por coletor
│   │
│   ├── Agent.Collectors/               # Coletores Técnicos Independentes
│   │   ├── ComputerIdentityCollector.cs # Hostname, UUID, Serial, Fabricante, Modelo, IPs, MACs
│   │   ├── OperatingSystemCollector.cs  # Edição, Build, Versão, UBR, Arquitetura, Boot
│   │   ├── MemoryCollector.cs           # GlobalMemoryStatusEx + Módulos físicos WMI
│   │   ├── StorageCollector.cs          # Volumes DriveInfo + Discos físicos NVMe/SSD/HDD
│   │   ├── SoftwareCollector.cs         # Registro HKLM/HKCU 64 e 32 bits com deduplicação
│   │   └── SecurityCollector.cs         # SecurityCenter2 (Antivírus, Firewall), BitLocker, SecureBoot
│   │
│   ├── Agent.Infrastructure/           # Clientes HTTP, SQLite Offline e Resiliência
│   │   ├── Configuration/AgentOptions.cs# Parâmetros de URL, intervalos e credenciais
│   │   ├── Http/AgentApiClient.cs       # HttpClient com Exponential Backoff e Retry
│   │   ├── Storage/SqliteOfflineQueue.cs# Fila offline local SQLite para máquinas sem rede
│   │   └── Services/InventoryOrchestrator.cs # Orquestrador com isolamento de falhas
│   │
│   └── Agent.Worker/                   # Windows Service (BackgroundService)
│       ├── Program.cs                  # Host builder e injeção de dependências
│       ├── Worker.cs                   # Ciclo de vida: Startup, Heartbeat 60s, Varredura 4h
│       ├── appsettings.json            # Configuração padrão do serviço
│       ├── install-service.ps1         # Script PowerShell de instalação do serviço Windows
│       └── uninstall-service.ps1       # Script PowerShell de desinstalação
│
└── tests/
    └── Agent.Tests/                    # Testes Unitários automatizados com xUnit
        ├── CollectorTests.cs
        ├── SerializationTests.cs
        └── DeduplicationTests.cs
```

---

## ⚙️ Como Compilar o Agente

### Pré-requisitos:
- .NET 8.0 SDK LTS instalado na estação de compilação ou pipeline CI/CD

### Compilação do Executável do Windows Service:
```powershell
cd agent/src/Agent.Worker
dotnet publish -c Release -r win-x64 --self-contained false -o C:\GIHS\Agent
```

---

## 🚀 Instalação do Serviço no Windows (10 ou 11 x64)

Abra o PowerShell como **Administrador** e execute:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-service.ps1 -ServerUrl "https://seu-servidor-gihs.com.br" -ApiKey "GIHS-AGENT-SECURE-KEY-2026-ENTERPRISE"
```

O script irá:
1. Criar a pasta corporativa `C:\ProgramData\GIHS\Agent`
2. Configurar o arquivo `appsettings.json` com o endpoint HTTPS
3. Registrar o serviço Windows `GIHS_Inventory_Agent` com inicialização automática (`Automatic`)
4. Configurar a recuperação automática para reiniciar o serviço em caso de falhas
5. Iniciar a execução contínua em segundo plano imediatamente

---

## 🛡️ Resiliência e Fila Offline (SQLite)

Se o computador perder a conectividade com a rede corporativa (desconexão de Wi-Fi, VPN fechada ou manutenção de servidor):
1. O agente tenta o envio com **Exponential Backoff** e até 3 tentativas.
2. Persiste automaticamente o inventário completo no banco de dados local SQLite (`C:\ProgramData\GIHS\Agent\offline_queue.db`).
3. Quando a conexão é restabelecida, a fila é processada e os dados são entregues com segurança ao PostgreSQL, garantindo integridade sem perda de dados históricos.
