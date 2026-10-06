using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;
using GIHS.Agent.Infrastructure.Configuration;

namespace GIHS.Agent.Infrastructure.Http
{
    public class AgentApiClient : IApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly AgentOptions _options;
        private readonly ILogger<AgentApiClient> _logger;
        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        public AgentApiClient(
            HttpClient httpClient,
            IOptions<AgentOptions> options,
            ILogger<AgentApiClient> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;

            var baseUri = _options.ServerBaseUrl.TrimEnd('/');
            _httpClient.BaseAddress = new Uri(baseUri);
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "GIHS-Windows-Agent/1.0.0 (Windows NT; x64)");
        }

        public async Task<HeartbeatResponse?> SendHeartbeatAsync(
            HeartbeatPayload payload, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "/api/agent/v1/heartbeat");
                request.Headers.Add("x-agent-key", _options.AgentApiKey);

                var json = JsonSerializer.Serialize(payload, JsonOpts);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Heartbeat response returned HTTP {StatusCode}", response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                return JsonSerializer.Deserialize<HeartbeatResponse>(content, JsonOpts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Heartbeat network error: {Message}", ex.Message);
                return null;
            }
        }

        public async Task<InventoryResponse?> SendInventoryAsync(
            FullInventoryPayload payload, 
            CancellationToken cancellationToken = default)
        {
            // Estratégia de Retry com Exponential Backoff
            int attempt = 0;
            int delayMs = 2000;

            while (attempt < _options.MaxRetryAttempts)
            {
                attempt++;
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, "/api/agent/v1/inventory");
                    request.Headers.Add("x-agent-key", _options.AgentApiKey);

                    var json = JsonSerializer.Serialize(payload, JsonOpts);
                    request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                    _logger.LogInformation("Enviando inventário técnico ao servidor GIHS ({Attempt}/{Max})...", attempt, _options.MaxRetryAttempts);

                    using var response = await _httpClient.SendAsync(request, cancellationToken);
                    var content = await response.Content.ReadAsStringAsync(cancellationToken);

                    if (response.IsSuccessStatusCode)
                    {
                        var resObj = JsonSerializer.Deserialize<InventoryResponse>(content, JsonOpts);
                        _logger.LogInformation("Inventário aceito com sucesso! Agente: {AgentId}, Ativo: {AssetId}", resObj?.AgentId, resObj?.AssetId);
                        return resObj;
                    }

                    _logger.LogWarning("Falha no envio de inventário: HTTP {StatusCode} - {Body}", response.StatusCode, content);

                    // Se for conflito de identidade (HTTP 409), o servidor já registrou para análise
                    if ((int)response.StatusCode == 409)
                    {
                        return JsonSerializer.Deserialize<InventoryResponse>(content, JsonOpts);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Erro de conexão ao enviar inventário (tentativa {Attempt}): {Message}", attempt, ex.Message);
                }

                if (attempt < _options.MaxRetryAttempts)
                {
                    await Task.Delay(delayMs, cancellationToken);
                    delayMs *= 2;
                }
            }

            return null;
        }
    }
}
