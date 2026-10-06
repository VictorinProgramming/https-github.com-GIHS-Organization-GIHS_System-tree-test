using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;
using GIHS.Agent.Infrastructure.Configuration;

namespace GIHS.Agent.Infrastructure.Storage
{
    public class SqliteOfflineQueue : IOfflineQueueService
    {
        private readonly string _connectionString;
        private readonly ILogger<SqliteOfflineQueue> _logger;

        public SqliteOfflineQueue(
            IOptions<AgentOptions> options,
            ILogger<SqliteOfflineQueue> logger)
        {
            _logger = logger;
            var dbPath = options.Value.OfflineDatabasePath;

            var dir = Path.GetDirectoryName(dbPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            _connectionString = $"Data Source={dbPath}";
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            try
            {
                using var conn = new SqliteConnection(_connectionString);
                conn.Open();

                var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS offline_inventories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        payload_json TEXT NOT NULL,
                        enqueued_at TEXT NOT NULL,
                        retry_count INTEGER DEFAULT 0
                    );
                ";
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                _logger.LogError("Falha ao inicializar banco SQLite de fila offline: {Message}", ex.Message);
            }
        }

        public async Task EnqueueInventoryAsync(FullInventoryPayload payload)
        {
            try
            {
                var json = JsonSerializer.Serialize(payload);
                using var conn = new SqliteConnection(_connectionString);
                await conn.OpenAsync();

                var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO offline_inventories (payload_json, enqueued_at, retry_count)
                    VALUES ($payload, $enqueued, 0);
                ";
                cmd.Parameters.AddWithValue("$payload", json);
                cmd.Parameters.AddWithValue("$enqueued", DateTime.UtcNow.ToString("o"));

                await cmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Inventário salvo na fila local offline (SQLite) para retransmissão posterior.");
            }
            catch (Exception ex)
            {
                _logger.LogError("Erro ao persistir inventário na fila SQLite: {Message}", ex.Message);
            }
        }

        public async Task<int> ProcessQueueAsync(IApiClient apiClient, CancellationToken cancellationToken = default)
        {
            int transmitted = 0;
            try
            {
                using var conn = new SqliteConnection(_connectionString);
                await conn.OpenAsync(cancellationToken);

                var selectCmd = conn.CreateCommand();
                selectCmd.CommandText = @"
                    SELECT id, payload_json, retry_count 
                    FROM offline_inventories 
                    ORDER BY id ASC 
                    LIMIT 5;
                ";

                using var reader = await selectCmd.ExecuteReaderAsync(cancellationToken);
                var items = new System.Collections.Generic.List<(long id, string json, int retries)>();

                while (await reader.ReadAsync(cancellationToken))
                {
                    items.Add((
                        reader.GetInt64(0),
                        reader.GetString(1),
                        reader.GetInt32(2)
                    ));
                }
                reader.Close();

                foreach (var item in items)
                {
                    if (cancellationToken.IsCancellationRequested) break;

                    try
                    {
                        var payload = JsonSerializer.Deserialize<FullInventoryPayload>(item.json);
                        if (payload != null)
                        {
                            var response = await apiClient.SendInventoryAsync(payload, cancellationToken);
                            if (response != null && response.Success)
                            {
                                // Remove do SQLite após envio com sucesso
                                var delCmd = conn.CreateCommand();
                                delCmd.CommandText = "DELETE FROM offline_inventories WHERE id = $id;";
                                delCmd.Parameters.AddWithValue("$id", item.id);
                                await delCmd.ExecuteNonQueryAsync(cancellationToken);

                                transmitted++;
                                _logger.LogInformation("Item da fila offline #{Id} transmitido e removido do SQLite com sucesso.", item.id);
                            }
                            else
                            {
                                // Incrementa contador de tentativas
                                var updCmd = conn.CreateCommand();
                                updCmd.CommandText = "UPDATE offline_inventories SET retry_count = retry_count + 1 WHERE id = $id;";
                                updCmd.Parameters.AddWithValue("$id", item.id);
                                await updCmd.ExecuteNonQueryAsync(cancellationToken);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("Falha ao retransmitir item #{Id} da fila offline: {Message}", item.id, ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Erro ao processar fila offline: {Message}", ex.Message);
            }

            return transmitted;
        }

        public async Task<int> GetPendingCountAsync()
        {
            try
            {
                using var conn = new SqliteConnection(_connectionString);
                await conn.OpenAsync();

                var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT COUNT(*) FROM offline_inventories;";
                var result = await cmd.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch
            {
                return 0;
            }
        }
    }
}
