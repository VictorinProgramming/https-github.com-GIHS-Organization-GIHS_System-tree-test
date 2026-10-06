using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;
using GIHS.Agent.Infrastructure.Configuration;

namespace GIHS.Agent.Infrastructure.Services
{
    public class InventoryOrchestrator : IInventoryOrchestrator
    {
        private readonly IComputerIdentityCollector _identityCollector;
        private readonly IOperatingSystemCollector _osCollector;
        private readonly IMemoryCollector _memoryCollector;
        private readonly IStorageCollector _storageCollector;
        private readonly ISoftwareCollector _softwareCollector;
        private readonly ISecurityCollector _securityCollector;
        private readonly AgentOptions _options;
        private readonly ILogger<InventoryOrchestrator> _logger;

        public InventoryOrchestrator(
            IComputerIdentityCollector identityCollector,
            IOperatingSystemCollector osCollector,
            IMemoryCollector memoryCollector,
            IStorageCollector storageCollector,
            ISoftwareCollector softwareCollector,
            ISecurityCollector securityCollector,
            IOptions<AgentOptions> options,
            ILogger<InventoryOrchestrator> logger)
        {
            _identityCollector = identityCollector;
            _osCollector = osCollector;
            _memoryCollector = memoryCollector;
            _storageCollector = storageCollector;
            _softwareCollector = softwareCollector;
            _securityCollector = securityCollector;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<FullInventoryPayload> CollectAllAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Iniciando coleta técnica independente de inventário...");

            var payload = new FullInventoryPayload
            {
                AgentVersion = "1.0.0",
                CollectedAt = DateTime.UtcNow.ToString("o")
            };

            // 1. Identidade do Computador
            try
            {
                payload.Identity = await _identityCollector.CollectAsync(cancellationToken);
                payload.AgentId = $"agt_{payload.Identity.MachineUuid.Replace("-", "").Substring(0, Math.Min(16, payload.Identity.MachineUuid.Length))}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha na coleta de identidade do computador.");
            }

            // 2. Sistema Operacional
            try
            {
                payload.OperatingSystem = await _osCollector.CollectAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha na coleta de Sistema Operacional.");
            }

            // 3. Memória RAM
            try
            {
                payload.Memory = await _memoryCollector.CollectAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha na coleta de Memória RAM.");
            }

            // 4. Armazenamento (Discos Físicos + Volumes)
            try
            {
                payload.Storage = await _storageCollector.CollectAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha na coleta de Armazenamento.");
            }

            // 5. Aplicativos Instalados
            try
            {
                payload.Software = await _softwareCollector.CollectAsync(cancellationToken);
                _logger.LogInformation("Coletados {Count} softwares instalados.", payload.Software.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha na coleta de Aplicativos Instalados.");
            }

            // 6. Segurança Cibernética (Antivírus, Firewall, BitLocker, SecureBoot)
            try
            {
                payload.Security = await _securityCollector.CollectAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha na coleta de Segurança.");
            }

            _logger.LogInformation("Coleta de inventário concluída com sucesso para o host {Hostname}.", payload.Identity.Hostname);
            return payload;
        }
    }
}
