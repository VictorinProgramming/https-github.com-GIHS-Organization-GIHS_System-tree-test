using System.Collections.Generic;
using Xunit;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Tests
{
    public class DeduplicationTests
    {
        [Fact]
        public void SoftwareList_ShouldDeduplicateEquivalentEntries()
        {
            var rawList = new List<InstalledSoftware>
            {
                new() { Name = "7-Zip 24.08 (x64)", Version = "24.08", Architecture = "x64" },
                new() { Name = "7-Zip 24.08 (x64)", Version = "24.08", Architecture = "x86" }, // Redundância de WOW64
                new() { Name = "Microsoft Edge", Version = "129.0", Architecture = "x64" }
            };

            var deduplicated = new Dictionary<string, InstalledSoftware>();
            foreach (var item in rawList)
            {
                var key = $"{item.Name}|{item.Version}";
                if (!deduplicated.ContainsKey(key))
                {
                    deduplicated[key] = item;
                }
            }

            Assert.Equal(2, deduplicated.Count);
        }
    }
}
