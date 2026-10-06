using System.Collections.Generic;
using System.Text.Json;
using Xunit;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Tests
{
    public class SerializationTests
    {
        [Fact]
        public void FullInventoryPayload_SerializesCorrectlyToExpectedJsonSchema()
        {
            var payload = new FullInventoryPayload
            {
                AgentId = "agt_test_001",
                AgentVersion = "1.0.0",
                Identity = new AgentIdentity
                {
                    Hostname = "TEST-PC",
                    MachineUuid = "11111111-2222-3333-4444-555555555555",
                    SerialNumber = "SN123456",
                    Manufacturer = "Dell",
                    Model = "Latitude"
                },
                OperatingSystem = new OperatingSystemInfo
                {
                    Name = "Windows 11 Pro",
                    Version = "23H2",
                    Build = "22631",
                    Architecture = "x64"
                },
                Memory = new MemoryInfo
                {
                    TotalBytes = 17179869184,
                    UsedBytes = 8589934592,
                    AvailableBytes = 8589934592,
                    UsedPercentage = 50.0
                },
                Software = new List<InstalledSoftware>
                {
                    new() { Name = "Google Chrome", Version = "129.0", Publisher = "Google LLC" }
                }
            };

            var json = JsonSerializer.Serialize(payload);

            Assert.Contains("\"hostname\":\"TEST-PC\"", json);
            Assert.Contains("\"machine_uuid\":\"11111111-2222-3333-4444-555555555555\"", json);
            Assert.Contains("\"serial_number\":\"SN123456\"", json);
            Assert.Contains("\"total_bytes\":17179869184", json);
            Assert.Contains("\"name\":\"Google Chrome\"", json);
        }

        [Fact]
        public void HeartbeatPayload_SerializesCorrectly()
        {
            var hb = new HeartbeatPayload
            {
                AgentId = "agt_test_001",
                MachineUuid = "uuid-123",
                Hostname = "HOST-01",
                AgentVersion = "1.0.0",
                CurrentUser = "admin"
            };

            var json = JsonSerializer.Serialize(hb);

            Assert.Contains("\"machine_uuid\":\"uuid-123\"", json);
            Assert.Contains("\"hostname\":\"HOST-01\"", json);
        }
    }
}
