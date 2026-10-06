namespace GIHS.Agent.Infrastructure.Configuration
{
    public class AgentOptions
    {
        public const string SectionName = "GIHS_Agent";

        /// <summary>
        /// URL base do Backend GIHS (ex: https://gihs.corp.bycomp.com.br)
        /// </summary>
        public string ServerBaseUrl { get; set; } = "http://localhost:3000";

        /// <summary>
        /// Chave de autenticação autorizada do Agente corporativo
        /// </summary>
        public string AgentApiKey { get; set; } = "GIHS-AGENT-SECURE-KEY-2026-ENTERPRISE";

        /// <summary>
        /// Intervalo periódico do Heartbeat (ping de presença em segundos)
        /// </summary>
        public int HeartbeatIntervalSeconds { get; set; } = 60;

        /// <summary>
        /// Intervalo periódico para inventário completo de hardware e softwares (horas)
        /// </summary>
        public int FullInventoryIntervalHours { get; set; } = 4;

        /// <summary>
        /// Caminho do banco local SQLite para resiliência e fila offline
        /// </summary>
        public string OfflineDatabasePath { get; set; } = "offline_queue.db";

        /// <summary>
        /// Tentativas de reenvio antes de persistir em fila local
        /// </summary>
        public int MaxRetryAttempts { get; set; } = 3;
    }
}
