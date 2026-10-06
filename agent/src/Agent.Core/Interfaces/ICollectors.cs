using System.Threading;
using System.Threading.Tasks;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Core.Interfaces
{
    public interface ICollector
    {
        string Name { get; }
    }

    public interface IComputerIdentityCollector : ICollector
    {
        Task<AgentIdentity> CollectAsync(CancellationToken cancellationToken = default);
    }

    public interface IOperatingSystemCollector : ICollector
    {
        Task<OperatingSystemInfo> CollectAsync(CancellationToken cancellationToken = default);
    }

    public interface IMemoryCollector : ICollector
    {
        Task<MemoryInfo> CollectAsync(CancellationToken cancellationToken = default);
    }

    public interface IStorageCollector : ICollector
    {
        Task<StorageInfo> CollectAsync(CancellationToken cancellationToken = default);
    }

    public interface ISoftwareCollector : ICollector
    {
        Task<List<InstalledSoftware>> CollectAsync(CancellationToken cancellationToken = default);
    }

    public interface ISecurityCollector : ICollector
    {
        Task<SecurityInfo> CollectAsync(CancellationToken cancellationToken = default);
    }

    public interface IApiClient
    {
        Task<HeartbeatResponse?> SendHeartbeatAsync(HeartbeatPayload payload, CancellationToken cancellationToken = default);
        Task<InventoryResponse?> SendInventoryAsync(FullInventoryPayload payload, CancellationToken cancellationToken = default);
    }

    public interface IOfflineQueueService
    {
        Task EnqueueInventoryAsync(FullInventoryPayload payload);
        Task<int> ProcessQueueAsync(IApiClient apiClient, CancellationToken cancellationToken = default);
        Task<int> GetPendingCountAsync();
    }

    public interface IInventoryOrchestrator
    {
        Task<FullInventoryPayload> CollectAllAsync(CancellationToken cancellationToken = default);
    }
}
