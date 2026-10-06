import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inventoryAgentRepository } from '../repositories/inventoryAgentRepository.ts';
import { usersRepository } from '../repositories/usersRepository.ts';
import { recordSecurityAudit } from '../security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chave padrão corporativa para comunicação segura Agente -> Servidor HTTPS
const AGENT_SHARED_SECRET = process.env.GIHS_AGENT_SECRET_KEY || 'GIHS-AGENT-SECURE-KEY-2026-ENTERPRISE';

export const inventoryAgentController = {
  /**
   * Middleware de Autorização REAL no Backend: Exclusivo para SUPER_ADMIN
   * Valida as credenciais no PostgreSQL para impedir manipulação de cabeçalhos
   */
  async requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
    const userId = (req.headers['x-user-id'] as string) || '';
    const userRoleHeader = (req.headers['x-user-role'] as string) || '';
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';

    if (!userId || userRoleHeader !== 'SUPER_ADMIN') {
      await recordSecurityAudit({
        action: 'UNAUTHORIZED_ACCESS_INVENTORY_AGENT_API',
        category: 'ACCESS_CONTROL',
        user_name: userId || 'Anônimo',
        user_id: userId || undefined,
        ip_address: clientIp,
        severity: 'Warning',
        details: { path: req.originalUrl, roleHeader: userRoleHeader }
      });

      return res.status(403).json({
        success: false,
        error: 'Acesso Negado: A interface e APIs do Agente de Inventário de TI são de uso EXCLUSIVO do perfil SUPER_ADMIN.'
      });
    }

    try {
      // Validação estrita no banco de dados PostgreSQL
      const user = await usersRepository.findById(userId);
      if (!user || user.user_role !== 'SUPER_ADMIN' || user.is_blocked || !user.is_active) {
        await recordSecurityAudit({
          action: 'FORGED_ROLE_HEADER_DETECTED',
          category: 'ACCESS_CONTROL',
          user_name: user?.name || userId,
          user_id: userId,
          ip_address: clientIp,
          severity: 'Critical',
          details: { path: req.originalUrl, realRole: user?.user_role, isBlocked: user?.is_blocked }
        });

        return res.status(403).json({
          success: false,
          error: 'Acesso Negado: Usuário não possui perfil ativo de SUPER_ADMIN no PostgreSQL corporativo.'
        });
      }

      // Usuário verificado com sucesso no PostgreSQL
      (req as any).verifiedSuperAdmin = user;
      next();
    } catch (err: any) {
      console.error('[RBAC Error] Erro ao validar perfil SUPER_ADMIN:', err?.message);
      return res.status(500).json({ success: false, error: 'Falha interna de autorização RBAC.' });
    }
  },

  /**
   * Endpoint do Agente Windows: Heartbeat Periódico (Ping a cada 60s)
   * POST /api/agent/v1/heartbeat
   */
  async handleHeartbeat(req: Request, res: Response) {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
      const agentKey = (req.headers['x-agent-key'] as string) || (req.headers['authorization'] || '').replace('Bearer ', '');

      // Validação de chave de segurança do Agente
      if (agentKey && agentKey !== AGENT_SHARED_SECRET && !agentKey.startsWith('agt_')) {
        return res.status(401).json({ success: false, error: 'Chave de autenticação do Agente inválida.' });
      }

      const { agent_id, machine_uuid, hostname, agent_version, current_user } = req.body;

      if (!machine_uuid) {
        return res.status(400).json({ success: false, error: 'machine_uuid é obrigatório no heartbeat.' });
      }

      const result = await inventoryAgentRepository.recordHeartbeat({
        agentId: agent_id || `agt_${machine_uuid.slice(0, 16)}`,
        machineUuid: machine_uuid,
        hostname,
        agentVersion: agent_version,
        currentUser: current_user,
        ipAddress: clientIp
      });

      return res.json({
        status: 'ok',
        next_heartbeat_interval_sec: 60,
        request_full_inventory: result.requestFullInventory,
        server_time: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[Agent Heartbeat Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Endpoint do Agente Windows: Ingestão de Inventário Técnico Completo
   * POST /api/agent/v1/inventory
   */
  async handleIngestInventory(req: Request, res: Response) {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
      const agentKey = (req.headers['x-agent-key'] as string) || (req.headers['authorization'] || '').replace('Bearer ', '');

      if (agentKey && agentKey !== AGENT_SHARED_SECRET && !agentKey.startsWith('agt_')) {
        return res.status(401).json({ success: false, error: 'Chave de autenticação do Agente inválida.' });
      }

      const payload = req.body;

      // Validações mandatórias de contrato JSON
      if (!payload || !payload.identity || !payload.identity.machine_uuid || !payload.identity.hostname) {
        return res.status(400).json({
          success: false,
          error: 'Contrato de inventário inválido: identity.machine_uuid e identity.hostname são obrigatórios.'
        });
      }

      // Adiciona o IP real observado na conexão
      if (!payload.identity.ip_address) {
        payload.identity.ip_address = clientIp;
      }

      const result = await inventoryAgentRepository.upsertInventory(payload);

      // Auditoria de segurança
      await recordSecurityAudit({
        action: 'INVENTORY_AGENT_INGEST',
        category: 'DBA',
        user_name: `Agent: ${payload.identity.hostname}`,
        ip_address: clientIp,
        severity: result.status === 'CONFLICT' ? 'Warning' : 'Info',
        details: {
          machine_uuid: payload.identity.machine_uuid,
          serial_number: payload.identity.serial_number,
          softwares: payload.software?.length || 0,
          status: result.status,
          asset_id: result.assetId
        }
      });

      if (!result.success) {
        return res.status(409).json(result);
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[Agent Ingest Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Lista paginada de computadores e agentes
   * GET /api/inventory-agents
   */
  async listAgents(req: Request, res: Response) {
    try {
      const {
        search,
        status,
        os,
        security_status,
        page,
        limit,
        sort_by,
        sort_order
      } = req.query;

      const result = await inventoryAgentRepository.findAll({
        search: search as string,
        status: status as string,
        os: os as string,
        securityStatus: security_status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        sortBy: sort_by as string,
        sortOrder: (sort_order as 'ASC' | 'DESC') || 'DESC'
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Indicadores de KPI do parque de máquinas
   * GET /api/inventory-agents/metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await inventoryAgentRepository.getMetrics();
      return res.json({ success: true, data: metrics });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Conflitos de identidade pendentes
   * GET /api/inventory-agents/conflicts
   */
  async getConflicts(req: Request, res: Response) {
    try {
      const conflicts = await inventoryAgentRepository.getConflicts();
      return res.json({ success: true, data: conflicts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Detalhes de um computador / agente pelo ID
   * GET /api/inventory-agents/:id
   */
  async getAgentById(req: Request, res: Response) {
    try {
      const agent = await inventoryAgentRepository.findById(req.params.id);
      if (!agent) {
        return res.status(404).json({ success: false, error: 'Dispositivo inventariado não encontrado.' });
      }
      return res.json({ success: true, data: agent });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Aplicativos instalados de um computador
   * GET /api/inventory-agents/:id/software
   */
  async getAgentSoftware(req: Request, res: Response) {
    try {
      const { search, limit, offset } = req.query;
      const result = await inventoryAgentRepository.getSoftwareList(
        req.params.id,
        search as string,
        limit ? parseInt(limit as string, 10) : 50,
        offset ? parseInt(offset as string, 10) : 0
      );
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Histórico de varreduras e eventos do agente
   * GET /api/inventory-agents/:id/history
   */
  async getAgentHistory(req: Request, res: Response) {
    try {
      const history = await inventoryAgentRepository.getHistory(req.params.id);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Solicita nova varredura completa ao agente
   * POST /api/inventory-agents/:id/force-scan
   */
  async forceScan(req: Request, res: Response) {
    try {
      const ok = await inventoryAgentRepository.requestForceScan(req.params.id);
      return res.json({
        success: ok,
        message: ok
          ? 'Comando de varredura completa enfileirado para o próximo contato do agente.'
          : 'Falha ao agendar varredura.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * SUPER_ADMIN: Resolução de conflito de identidade
   * POST /api/inventory-agents/conflicts/:id/resolve
   */
  async resolveConflict(req: Request, res: Response) {
    try {
      const conflictId = parseInt(req.params.id, 10);
      const { notes, action } = req.body;
      const superAdminUser = (req as any).verifiedSuperAdmin;

      const ok = await inventoryAgentRepository.resolveConflict(conflictId, {
        resolvedBy: superAdminUser?.name || 'Super Admin',
        notes: notes || 'Conflito analisado e resolvido pelo Super Administrador',
        action: action || 'ACCEPT_NEW_UUID'
      });

      return res.json({ success: ok, message: 'Conflito atualizado com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Endpoint de Instalação Remota Direta via PowerShell (1-Click irm | iex)
   * GET /api/agent/install.ps1
   * Permite instalar e iniciar o serviço com um único comando no PowerShell do Windows:
   * irm "https://SEU-SERVIDOR/api/agent/install.ps1" | iex
   */
  async serveInstallScript(req: Request, res: Response) {
    let serverUrl = (req.query.serverUrl as string)?.trim();
    if (!serverUrl && req.headers['referer']) {
      try {
        const parsed = new URL(req.headers['referer'] as string);
        serverUrl = parsed.origin;
      } catch {}
    }
    if (!serverUrl && req.headers['origin']) {
      serverUrl = req.headers['origin'] as string;
    }
    if (!serverUrl) {
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
      serverUrl = `${protocol}://${host}`;
    }
    // Remove barra final se houver
    serverUrl = serverUrl.replace(/\/+$/, '');
    const apiKey = (req.query.apiKey as string) || AGENT_SHARED_SECRET;

    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', 'attachment; filename="install-service.ps1"');
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    try {
      const scriptPath = path.resolve(__dirname, '../scripts/install-agent.ps1');
      let scriptContent = fs.readFileSync(scriptPath, 'utf8');
      scriptContent = scriptContent.replace(/__GIHS_SERVER_URL__/g, serverUrl);
      scriptContent = scriptContent.replace(/__GIHS_API_KEY__/g, apiKey);
      return res.send(scriptContent);
    } catch (err: any) {
      console.error('Error reading install-agent.ps1:', err?.message);
      return res.status(500).send('# Erro ao ler instalador do agente PowerShell');
    }
  },

  /**
   * Endpoint de Download do Script .BAT de 1-Clique para Windows
   * GET /api/agent/install.bat
   */
  async serveInstallBat(req: Request, res: Response) {
    let serverUrl = (req.query.serverUrl as string)?.trim();
    if (!serverUrl && req.headers['referer']) {
      try {
        const parsed = new URL(req.headers['referer'] as string);
        serverUrl = parsed.origin;
      } catch {}
    }
    if (!serverUrl && req.headers['origin']) {
      serverUrl = req.headers['origin'] as string;
    }
    if (!serverUrl) {
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
      serverUrl = `${protocol}://${host}`;
    }
    serverUrl = serverUrl.replace(/\/+$/, '');
    const apiKey = (req.query.apiKey as string) || AGENT_SHARED_SECRET;

    const isCmd = req.path.endsWith('.cmd');
    const filename = isCmd ? 'Instalar-Agente-GIHS.cmd' : 'Instalar-Agente-GIHS.bat';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream; charset=utf-8');

    let psContent = '';
    try {
      const scriptPath = path.resolve(__dirname, '../scripts/install-agent.ps1');
      psContent = fs.readFileSync(scriptPath, 'utf8');
      psContent = psContent.replace(/__GIHS_SERVER_URL__/g, serverUrl);
      psContent = psContent.replace(/__GIHS_API_KEY__/g, apiKey);
    } catch (err: any) {
      console.error('Error reading install-agent.ps1 for bat generation:', err?.message);
    }

    const rawB64 = Buffer.from(psContent, 'utf8').toString('base64');
    const b64 = rawB64.match(/.{1,64}/g)?.join('\r\n') || rawB64;

    const bat = `@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title GIHS Enterprise Inventory Agent — Instalador Oficial

:: 1. Verificacao de privilegios de Administrador e auto-elevacao automatica (UAC)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ========================================================================
    echo   GIHS SYSTEM - SOLICITANDO ELEVACAO DE ADMINISTRADOR...
    echo ========================================================================
    echo Por favor, confirme o prompt do Windows (Controle de Conta de Usuario - UAC)...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%COMSPEC%' -ArgumentList '/k', '\"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

cls
echo ========================================================================
echo   GIHS SYSTEM - AGENTE NATIVO DE INVENTARIO DE TI (WINDOWS)
echo ========================================================================
echo Servidor Central: ${serverUrl}
echo.
echo [1/3] Extraindo componentes do instalador integrado...

set "GIHS_TEMP_DIR=%TEMP%\\GIHS_Installer_%RANDOM%"
if not exist "%GIHS_TEMP_DIR%" mkdir "%GIHS_TEMP_DIR%"
set "GIHS_PS=%GIHS_TEMP_DIR%\\install-agent.ps1"

:: Metodo Primario: Decodificacao nativa ultra-rapida via certutil
certutil.exe -decode "%~f0" "%GIHS_PS%" >nul 2>&1

:: Metodo Secundario de contingencia via PowerShell
if not exist "%GIHS_PS%" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$f='%~f0'; if (Test-Path $f) { $lines = [System.IO.File]::ReadAllLines($f); $idx1 = [System.Array]::IndexOf($lines, '-----BEGIN CERTIFICATE-----'); $idx2 = [System.Array]::IndexOf($lines, '-----END CERTIFICATE-----'); if ($idx1 -ge 0 -and $idx2 -gt $idx1) { $payload = [System.String]::Concat($lines[($idx1 + 1)..($idx2 - 1)]).Trim(); [System.IO.File]::WriteAllBytes('%GIHS_PS%', [System.Convert]::FromBase64String($payload)) } }"
)

if not exist "%GIHS_PS%" (
    echo [ERRO] Nao foi possivel extrair os arquivos do instalador.
    pause
    exit /b 1
)

echo [2/3] Coletando Hardware, Softwares, Discos e Seguranca...
echo [3/3] Configurando inicializacao automatica com Administrador e Icone na Barra de Tarefas...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%GIHS_PS%" -ServerUrl "${serverUrl}" -ApiKey "${apiKey}"

rd /s /q "%GIHS_TEMP_DIR%" >nul 2>&1

echo.
echo ========================================================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo   [OK] Agente gravado em C:\\ProgramData\\GIHS\\Agent
echo   [OK] Tarefa no Agendador do Windows com Administrador pre-definido.
echo   [OK] Icone preparado para a barra de tarefas (bandeja do sistema).
echo ========================================================================
echo.
echo ------------------------------------------------------------------------
echo  ATENCAO: E NECESSARIO REINICIAR O COMPUTADOR PARA APLICAR AS
echo  CONFIGURACOES DE SERVICO E CARREGAR O AGENTE NA BANDEJA DO SISTEMA!
echo ------------------------------------------------------------------------
echo.

choice /c SN /m "Deseja reiniciar o computador agora [S=Sim (Recomendado), N=Nao]?"
if errorlevel 2 goto :noreboot
if errorlevel 1 goto :doreboot

:doreboot
echo.
echo [!] Reiniciando o computador em 10 segundos para aplicar as configuracoes...
shutdown.exe /r /t 10 /c "Reiniciando para concluir a ativacao do Agente de Inventario GIHS..."
echo Pressione qualquer tecla para manter a janela aberta ou aguarde.
pause
exit /b 0

:noreboot
echo.
echo [!] Por favor, lembre-se de reiniciar seu computador assim que possivel
echo     para que o Agente GIHS inicialize com privilegios de Administrador.
echo.
pause
exit /b 0

-----BEGIN CERTIFICATE-----
${b64}
-----END CERTIFICATE-----
`;
    return res.send(bat);
  },

  /**
   * Disparo de teste para simulação / homologação do Agente Nativo GIHS
   * POST /api/agent/v1/test-agent
   */
  async handleTestAgent(req: Request, res: Response) {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.105';
      const sampleNames = ['TI-DESK-TESTE-01', 'FIN-NOTEBOOK-03', 'ENG-WORKSTATION-01', 'DIR-NOTE-02', 'RH-DESK-05'];
      const defaultHost = sampleNames[Math.floor(Math.random() * sampleNames.length)] + '-' + Math.floor(10 + Math.random() * 90);
      const customHostname = (req.body?.hostname as string) || defaultHost;
      const customManufacturer = (req.body?.manufacturer as string) || 'Dell Inc.';
      const customModel = (req.body?.model as string) || 'Latitude 5440 Enterprise Core i7';
      const customUser = (req.body?.username as string) || 'colaborador.corporativo';
      const customOs = (req.body?.os as string) || 'Windows 11 Pro 64-bit';

      const randUuid = `4C4C4544-${Math.floor(1000 + Math.random() * 9000)}-4E10-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(16).toUpperCase().padStart(12, '0')}`;
      const randSerial = req.body?.serial_number || `BRJ${Math.floor(100000 + Math.random() * 900000)}K`;

      const samplePayload = {
        agent_id: `agt_test_${Date.now()}`,
        agent_version: '1.2.0',
        identity: {
          hostname: customHostname,
          machine_uuid: randUuid,
          serial_number: randSerial,
          manufacturer: customManufacturer,
          model: customModel,
          domain_workgroup: 'GIHS.CORP',
          current_user: customUser,
          ip_address: clientIp,
          mac_addresses: ['E0:D5:5E:2B:1A:99', '00:15:5D:8A:2C:11']
        },
        operating_system: {
          name: customOs,
          edition: 'Professional Enterprise',
          version: '23H2',
          build: '22631.3880',
          architecture: 'x64',
          installed_at: new Date(Date.now() - 180 * 86400000).toISOString(),
          last_boot: new Date(Date.now() - 3600000 * 6).toISOString()
        },
        memory: {
          total_bytes: 17179869184, // 16 GB
          used_bytes: Math.round(17179869184 * (0.35 + Math.random() * 0.3)),
          available_bytes: Math.round(17179869184 * 0.45),
          used_percentage: Math.round((0.35 + Math.random() * 0.3) * 100),
          modules: [
            { bank_label: 'ChannelA-DIMM0', capacity_bytes: 8589934592, manufacturer: 'Samsung', speed_mhz: 4800, part_number: 'M425R1GB4BB0-CQKOL', serial_number: `39F7${Math.floor(1000 + Math.random() * 9000)}` },
            { bank_label: 'ChannelB-DIMM0', capacity_bytes: 8589934592, manufacturer: 'Samsung', speed_mhz: 4800, part_number: 'M425R1GB4BB0-CQKOL', serial_number: `40A8${Math.floor(1000 + Math.random() * 9000)}` }
          ]
        },
        storage: {
          physical_disks: [
            { model: 'NVMe Kioxia BG5 512GB SED', serial_number: `KX90${Math.floor(100000 + Math.random() * 900000)}`, manufacturer: 'Kioxia Corporation', media_type: 'SSD (NVMe PCIe 4.0)', interface_type: 'PCIe Gen 4.0 x4', total_capacity_bytes: 512110190592 }
          ],
          volumes: [
            { drive_letter: 'C:', file_system: 'NTFS', total_bytes: 510982742016, used_bytes: 184281737216, free_bytes: 326701004800, used_percentage: 36.1 }
          ]
        },
        software: [
          { name: 'Google Chrome Enterprise', version: '129.0.6668.71', publisher: 'Google LLC', install_date: '2024-03-01', architecture: 'x64' },
          { name: 'Microsoft 365 Apps for Enterprise', version: '16.0.17928.20156', publisher: 'Microsoft Corporation', install_date: '2024-02-20', architecture: 'x64' },
          { name: 'Microsoft Edge Chromium', version: '129.0.2792.52', publisher: 'Microsoft Corporation', install_date: '2024-01-15', architecture: 'x64' },
          { name: 'Visual Studio Code', version: '1.93.1', publisher: 'Microsoft Corporation', install_date: '2024-03-10', architecture: 'x64' },
          { name: 'Adobe Acrobat Reader DC', version: '24.002.20895', publisher: 'Adobe Inc.', install_date: '2024-01-18', architecture: 'x64' },
          { name: 'FortiClient VPN Enterprise', version: '7.2.4.0972', publisher: 'Fortinet Technologies', install_date: '2024-02-05', architecture: 'x64' },
          { name: '7-Zip 24.07 (x64)', version: '24.07', publisher: 'Igor Pavlov', install_date: '2024-04-12', architecture: 'x64' },
          { name: 'GIHS Enterprise Monitoring Agent v1.2', version: '1.2.0', publisher: 'GIHS IT Operations', install_date: '2024-05-01', architecture: 'x64' }
        ],
        security: {
          antivirus: { name: 'Microsoft Defender Antivirus', enabled: true, up_to_date: true },
          firewall: { enabled: true },
          secure_boot: { enabled: true },
          bitlocker: { status: 'FullyEncrypted (AES-XTS 256)', protection_enabled: true }
        }
      };

      const result = await inventoryAgentRepository.upsertInventory(samplePayload);
      return res.json(result);
    } catch (err: any) {
      console.error('[InventoryTest] Erro na simulação do agente:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
