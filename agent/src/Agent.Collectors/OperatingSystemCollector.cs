using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Collectors
{
    public class OperatingSystemCollector : IOperatingSystemCollector
    {
        public string Name => "OperatingSystemCollector";
        private readonly ILogger<OperatingSystemCollector> _logger;

        public OperatingSystemCollector(ILogger<OperatingSystemCollector> logger)
        {
            _logger = logger;
        }

        public Task<OperatingSystemInfo> CollectAsync(CancellationToken cancellationToken = default)
        {
            var osInfo = new OperatingSystemInfo
            {
                Architecture = Environment.Is64BitOperatingSystem ? "x64" : "x86",
                Name = "Windows"
            };

            try
            {
                using var key = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64)
                    .OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion");

                if (key != null)
                {
                    osInfo.Name = key.GetValue("ProductName")?.ToString() ?? "Windows";
                    osInfo.Edition = key.GetValue("CompositionEditionID")?.ToString() ?? key.GetValue("EditionID")?.ToString();
                    osInfo.Version = key.GetValue("DisplayVersion")?.ToString() ?? key.GetValue("ReleaseId")?.ToString();
                    osInfo.Build = key.GetValue("CurrentBuild")?.ToString();

                    var ubr = key.GetValue("UBR")?.ToString();
                    if (!string.IsNullOrEmpty(ubr) && !string.IsNullOrEmpty(osInfo.Build))
                    {
                        osInfo.Build = $"{osInfo.Build}.{ubr}";
                    }

                    // Se for Windows 10 no ProductName mas build >= 22000, normaliza para Windows 11
                    if (int.TryParse(key.GetValue("CurrentBuild")?.ToString(), out var buildNumber) && buildNumber >= 22000)
                    {
                        osInfo.Name = osInfo.Name.Replace("Windows 10", "Windows 11");
                    }

                    // InstallDate (segundos desde 1970-01-01)
                    var installTimestamp = key.GetValue("InstallDate");
                    if (installTimestamp is int unixSeconds && unixSeconds > 0)
                    {
                        var installedDt = DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime;
                        osInfo.InstalledAt = installedDt.ToString("o");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Registry OS extraction failed: {Message}", ex.Message);
            }

            // Último Boot (Tempo de atividade através de TickCount64)
            try
            {
                var uptimeMs = Environment.TickCount64;
                var lastBootTime = DateTime.UtcNow.AddMilliseconds(-uptimeMs);
                osInfo.LastBoot = lastBootTime.ToString("o");
            }
            catch
            {
                // Fallback
            }

            return Task.FromResult(osInfo);
        }
    }
}
