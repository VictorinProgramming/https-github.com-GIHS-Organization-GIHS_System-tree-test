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
    public class SecurityCollector : ISecurityCollector
    {
        public string Name => "SecurityCollector";
        private readonly ILogger<SecurityCollector> _logger;

        public SecurityCollector(ILogger<SecurityCollector> logger)
        {
            _logger = logger;
        }

        public Task<SecurityInfo> CollectAsync(CancellationToken cancellationToken = default)
        {
            var secInfo = new SecurityInfo
            {
                Antivirus = new AntivirusStatus { Name = "Windows Defender Antivirus", Enabled = true, UpToDate = true },
                Firewall = new FirewallStatus { Enabled = true },
                SecureBoot = new SecureBootStatus { Enabled = true },
                BitLocker = new BitLockerStatus { Status = "Protected", ProtectionEnabled = true }
            };

            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return Task.FromResult(secInfo);
            }

            // 1. Antivírus via WMI root\SecurityCenter2
            try
            {
                using var searcher = new System.Management.ManagementObjectSearcher(
                    @"root\SecurityCenter2", "SELECT * FROM AntivirusProduct");

                foreach (System.Management.ManagementObject obj in searcher.Get())
                {
                    var name = obj["displayName"]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(name)) continue;

                    secInfo.Antivirus.Name = name;

                    // Decodificação do bitmask productState no Windows Security Center
                    if (uint.TryParse(obj["productState"]?.ToString(), out var productState))
                    {
                        // Byte 2: Definições de assinaturas (0x00 = Up-to-date, 0x10 = Out of date)
                        // Byte 1: RTP Status (0x10 = On, 0x00 / 0x01 = Off)
                        var stateHex = productState.ToString("X6");
                        if (stateHex.Length >= 6)
                        {
                            var rtp = stateHex.Substring(2, 2);
                            var sig = stateHex.Substring(4, 2);

                            secInfo.Antivirus.Enabled = rtp == "10" || rtp == "11";
                            secInfo.Antivirus.UpToDate = sig == "00";
                        }
                    }
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SecurityCenter2 Antivirus query info: {Message}", ex.Message);
            }

            // 2. Firewall via WMI root\SecurityCenter2
            try
            {
                using var searcher = new System.Management.ManagementObjectSearcher(
                    @"root\SecurityCenter2", "SELECT * FROM FirewallProduct");

                foreach (System.Management.ManagementObject obj in searcher.Get())
                {
                    if (uint.TryParse(obj["productState"]?.ToString(), out var productState))
                    {
                        var stateHex = productState.ToString("X6");
                        if (stateHex.Length >= 6)
                        {
                            var rtp = stateHex.Substring(2, 2);
                            secInfo.Firewall.Enabled = rtp == "10" || rtp == "11";
                        }
                    }
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SecurityCenter2 Firewall query info: {Message}", ex.Message);
            }

            // 3. Secure Boot via Registry
            try
            {
                using var key = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Default)
                    .OpenSubKey(@"SYSTEM\CurrentControlSet\Control\SecureBoot\State");

                if (key != null)
                {
                    var val = key.GetValue("UEFISecureBootEnabled");
                    if (val is int intVal)
                    {
                        secInfo.SecureBoot.Enabled = intVal == 1;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SecureBoot registry check info: {Message}", ex.Message);
            }

            // 4. BitLocker via CIMV2\Security\MicrosoftVolumeEncryption
            try
            {
                using var searcher = new System.Management.ManagementObjectSearcher(
                    @"root\CIMV2\Security\MicrosoftVolumeEncryption", 
                    "SELECT DriveLetter, ProtectionStatus, ConversionStatus FROM Win32_EncryptableVolume WHERE DriveLetter = 'C:'");

                foreach (System.Management.ManagementObject obj in searcher.Get())
                {
                    var prot = obj["ProtectionStatus"]?.ToString();
                    var conv = obj["ConversionStatus"]?.ToString();

                    secInfo.BitLocker.ProtectionEnabled = prot == "1";
                    secInfo.BitLocker.Status = conv switch
                    {
                        "1" => "FullyEncrypted",
                        "2" => "EncryptionInProgress",
                        "0" => "FullyDecrypted",
                        _ => prot == "1" ? "Protected" : "Unprotected"
                    };
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("BitLocker WMI check info: {Message}", ex.Message);
            }

            return Task.FromResult(secInfo);
        }
    }
}
