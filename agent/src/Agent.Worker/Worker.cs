using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;
using GIHS.Agent.Infrastructure.Configuration;

namespace GIHS.Agent.Worker
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly IApiClient _apiClient;
        private readonly IInventoryOrchestrator _orchestrator;
        private readonly IOfflineQueueService _offlineQueue;
        private readonly IComputerIdentityCollector _identityCollector;
        private readonly AgentOptions _options;

        private AgentIdentity? _cachedIdentity;
        private DateTime _lastFullInventoryTime = DateTime.MinValue;

        public Worker(
            ILogger<Worker> logger,
            IApiClient apiClient,
            IInventoryOrchestrator orchestrator,
            IOfflineQueueService offlineQueue,
            IComputerIdentityCollector identityCollector,
            IOptions<AgentOptions> options)
        {
            _logger = logger;
            _apiClient = apiClient;
            _orchestrator = orchestrator;
            _offlineQueue = offlineQueue;
            _identityCollector = identityCollector;
            _options = options.Value;
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("=================================================");
            _logger.LogInformation("GIHS Inventory Agent Worker Service iniciando...");
            _logger.LogInformation("Servidor Central: {Url}", _options.ServerBaseUrl);
            _logger.LogInformation("Ambiente: Windows x64 .NET 8 LTS");
            _logger.LogInformation("=================================================");

            try
            {
                _cachedIdentity = await _identityCollector.CollectAsync(cancellationToken);
                _logger.LogInformation("Dispositivo Identificado: {Hostname} (UUID: {Uuid}, Serial: {Serial})",
                    _cachedIdentity.Hostname, _cachedIdentity.MachineUuid, _cachedIdentity.SerialNumber);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Não foi possível pré-carregar identidade na inicialização: {Message}", ex.Message);
            }

            await base.StartAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // 1. Coleta e envio de inventário imediato ao iniciar o serviço
            await PerformFullInventoryAsync(stoppingToken);

            // 2. Loop de execução contínua em segundo plano
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // A. Processamento de itens acumulados na fila offline (se houver conectividade)
                    var processed = await _offlineQueue.ProcessQueueAsync(_apiClient, stoppingToken);
                    if (processed > 0)
                    {
                        _logger.LogInformation("Fila offline processada: {Count} registros transmitidos ao servidor.", processed);
                    }

                    // B. Envio de Heartbeat (Ping Periódico)
                    if (_cachedIdentity != null)
                    {
                        var heartbeat = new HeartbeatPayload
                        {
                            AgentId = $"agt_{_cachedIdentity.MachineUuid.Replace("-", "").Substring(0, Math.Min(16, _cachedIdentity.MachineUuid.Length))}",
                            MachineUuid = _cachedIdentity.MachineUuid,
                            Hostname = _cachedIdentity.Hostname,
                            AgentVersion = "1.0.0",
                            CurrentUser = Environment.UserName
                        };

                        var response = await _apiClient.SendHeartbeatAsync(heartbeat, stoppingToken);

                        if (response != null)
                        {
                            // Se o servidor solicitar varredura completa (ex: primeira vez ou comando forçado pelo Super Admin)
                            if (response.RequestFullInventory)
                            {
                                _logger.LogInformation("Servidor solicitou envio imediato de inventário completo via Heartbeat.");
                                await PerformFullInventoryAsync(stoppingToken);
                            }
                        }
                    }

                    // C. Verificação de Agendamento Periódico de Inventário Completo
                    var hoursSinceLastScan = (DateTime.UtcNow - _lastFullInventoryTime).TotalHours;
                    if (hoursSinceLastScan >= _options.FullInventoryIntervalHours)
                    {
                        _logger.LogInformation("Intervalo de inventário periódico atingido ({Hours:F1} horas). Executando coleta...", hoursSinceLastScan);
                        await PerformFullInventoryAsync(stoppingToken);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro inesperado no ciclo de trabalho do Agente.");
                }

                // Aguarda o próximo ciclo de Heartbeat (padrão: 60 segundos)
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(_options.HeartbeatIntervalSeconds), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task PerformFullInventoryAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Iniciando varredura técnica completa de hardware, software e segurança...");
                var payload = await _orchestrator.CollectAllAsync(cancellationToken);

                // Atualiza cache de identidade
                _cachedIdentity = payload.Identity;

                // Tenta enviar via HTTPS diretamente ao Backend
                var response = await _apiClient.SendInventoryAsync(payload, cancellationToken);

                if (response != null && (response.Success || response.Status == "CONFLICT"))
                {
                    _logger.LogInformation("Inventário completo sincronizado com sucesso no PostgreSQL central.");
                    _lastFullInventoryTime = DateTime.UtcNow;
                }
                else
                {
                    // Falha de comunicação ou timeout: armazena na fila offline SQLite para entrega garantida
                    _logger.LogWarning("Conexão com servidor indisponível. Armazenando inventário na fila offline SQLite.");
                    await _offlineQueue.EnqueueInventoryAsync(payload);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha durante o processo de inventário completo.");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("GIHS Inventory Agent Worker Service encerrando com segurança (Graceful Shutdown)...");
            await base.StopAsync(cancellationToken);
        }
    }
}
