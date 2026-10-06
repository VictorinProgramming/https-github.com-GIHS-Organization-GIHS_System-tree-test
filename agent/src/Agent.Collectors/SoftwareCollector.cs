using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Collectors
{
    public class SoftwareCollector : ISoftwareCollector
    {
        public string Name => "SoftwareCollector";
        private readonly ILogger<SoftwareCollector> _logger;

        public SoftwareCollector(ILogger<SoftwareCollector> logger)
        {
            _logger = logger;
        }

        public Task<List<InstalledSoftware>> CollectAsync(CancellationToken cancellationToken = default)
        {
            var softwareMap = new Dictionary<string, InstalledSoftware>(StringComparer.OrdinalIgnoreCase);

            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return Task.FromResult(softwareMap.Values.ToList());
            }

            try
            {
                // 1. HKLM 64-bit
                ScanRegistryHive(
                    RegistryHive.LocalMachine, 
                    RegistryView.Registry64, 
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", 
                    "AllUsers (SYSTEM)", 
                    "x64", 
                    softwareMap);

                // 2. HKLM 32-bit (WOW6432Node)
                ScanRegistryHive(
                    RegistryHive.LocalMachine, 
                    RegistryView.Registry32, 
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", 
                    "AllUsers (SYSTEM)", 
                    "x86", 
                    softwareMap);

                // 3. HKCU (Per-user installations)
                ScanRegistryHive(
                    RegistryHive.CurrentUser, 
                    RegistryView.Default, 
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", 
                    Environment.UserName, 
                    Environment.Is64BitOperatingSystem ? "x64" : "x86", 
                    softwareMap);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Software registry scan failed: {Message}", ex.Message);
            }

            return Task.FromResult(softwareMap.Values.OrderBy(s => s.Name).ToList());
        }

        private static void ScanRegistryHive(
            RegistryHive hive,
            RegistryView view,
            string subKeyPath,
            string defaultUser,
            string arch,
            Dictionary<string, InstalledSoftware> map)
        {
            try
            {
                using var baseKey = RegistryKey.OpenBaseKey(hive, view);
                using var uninstallKey = baseKey.OpenSubKey(subKeyPath);
                if (uninstallKey == null) return;

                foreach (var subKeyName in uninstallKey.GetSubKeyNames())
                {
                    try
                    {
                        using var appKey = uninstallKey.OpenSubKey(subKeyName);
                        if (appKey == null) continue;

                        var displayName = appKey.GetValue("DisplayName")?.ToString()?.Trim();
                        if (string.IsNullOrWhiteSpace(displayName)) continue;

                        // Desconsidera atualizações secundárias ou componentes de sistema ocultos
                        var isSystemComponent = appKey.GetValue("SystemComponent");
                        if (isSystemComponent is int sysComp && sysComp == 1) continue;

                        var parentKeyName = appKey.GetValue("ParentKeyName")?.ToString();
                        if (!string.IsNullOrEmpty(parentKeyName)) continue; // Update child

                        var displayVersion = appKey.GetValue("DisplayVersion")?.ToString()?.Trim();
                        var publisher = appKey.GetValue("Publisher")?.ToString()?.Trim();
                        var installDate = appKey.GetValue("InstallDate")?.ToString()?.Trim();
                        var installLocation = appKey.GetValue("InstallLocation")?.ToString()?.Trim();
                        var uninstallString = appKey.GetValue("UninstallString")?.ToString()?.Trim();

                        // Normalização de InstallDate (formato AAAAMMDD -> AAAA-MM-DD)
                        if (!string.IsNullOrEmpty(installDate) && installDate.Length == 8 && int.TryParse(installDate, out _))
                        {
                            installDate = $"{installDate.Substring(0, 4)}-{installDate.Substring(4, 2)}-{installDate.Substring(6, 2)}";
                        }

                        // Deduplicação inteligente (ex: mesmo nome e versão aparecendo em 32 e 64 bits)
                        var deduplicationKey = $"{displayName}|{displayVersion}";

                        if (!map.ContainsKey(deduplicationKey))
                        {
                            map[deduplicationKey] = new InstalledSoftware
                            {
                                Name = displayName,
                                Version = displayVersion,
                                Publisher = publisher,
                                InstallDate = installDate,
                                InstalledForUser = defaultUser,
                                InstallLocation = installLocation,
                                UninstallString = uninstallString,
                                Architecture = arch
                            };
                        }
                    }
                    catch
                    {
                        // Continua varrendo os próximos aplicativos sem abortar o processo
                    }
                }
            }
            catch
            {
                // Hive inacessível
            }
        }
    }
}
