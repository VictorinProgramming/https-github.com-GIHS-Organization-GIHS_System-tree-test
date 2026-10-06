using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using GIHS.Agent.Collectors;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Tests
{
    public class CollectorTests
    {
        [Fact]
        public async Task ComputerIdentityCollector_ShouldReturnValidHostname()
        {
            var logger = NullLogger<ComputerIdentityCollector>.Instance;
            var collector = new ComputerIdentityCollector(logger);

            var identity = await collector.CollectAsync();

            Assert.NotNull(identity);
            Assert.False(string.IsNullOrWhiteSpace(identity.Hostname));
            Assert.False(string.IsNullOrWhiteSpace(identity.MachineUuid));
        }

        [Fact]
        public async Task OperatingSystemCollector_ShouldReturnArchitecture()
        {
            var logger = NullLogger<OperatingSystemCollector>.Instance;
            var collector = new OperatingSystemCollector(logger);

            var os = await collector.CollectAsync();

            Assert.NotNull(os);
            Assert.Contains(os.Architecture, new[] { "x64", "x86", "arm64" });
            Assert.False(string.IsNullOrWhiteSpace(os.Name));
        }

        [Fact]
        public async Task MemoryCollector_ShouldReturnTotalBytesGreaterThanZero()
        {
            var logger = NullLogger<MemoryCollector>.Instance;
            var collector = new MemoryCollector(logger);

            var memory = await collector.CollectAsync();

            Assert.NotNull(memory);
            Assert.True(memory.TotalBytes > 0);
            Assert.True(memory.AvailableBytes >= 0);
            Assert.True(memory.UsedPercentage >= 0 && memory.UsedPercentage <= 100);
        }

        [Fact]
        public async Task StorageCollector_ShouldReturnNonNullVolumes()
        {
            var logger = NullLogger<StorageCollector>.Instance;
            var collector = new StorageCollector(logger);

            var storage = await collector.CollectAsync();

            Assert.NotNull(storage);
            Assert.NotNull(storage.Volumes);
            Assert.NotNull(storage.PhysicalDisks);
        }
    }
}
