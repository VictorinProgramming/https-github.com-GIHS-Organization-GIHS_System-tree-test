using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Collectors
{
    public class ComputerIdentityCollector : IComputerIdentityCollector
    {
        public string Name => "ComputerIdentityCollector";
        private readonly ILogger<ComputerIdentityCollector> _logger;

        public ComputerIdentityCollector(ILogger<ComputerIdentityCollector> logger)
        {
            _logger = logger;
        }

        public Task<AgentIdentity> CollectAsync(CancellationToken cancellationToken = default)
        {
            var identity = new AgentIdentity
            {
                Hostname = Environment.MachineName,
                CurrentUser = Environment.UserName,
                DomainWorkgroup = Environment.UserDomainName
            };

            // 1. Machine UUID (Prioridade: Win32_ComputerSystemProduct -> Fallback Registry MachineGuid)
            try
            {
                identity.MachineUuid = GetWmiProperty("Win32_ComputerSystemProduct", "UUID");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WMI UUID collection failed: {Message}", ex.Message);
            }

            if (string.IsNullOrWhiteSpace(identity.MachineUuid) || identity.MachineUuid == "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF")
            {
                identity.MachineUuid = GetRegistryMachineGuid();
            }

            // 2. Serial Number & Fabricante & Modelo
            try
            {
                identity.SerialNumber = GetWmiProperty("Win32_BIOS", "SerialNumber");
                if (string.IsNullOrWhiteSpace(identity.SerialNumber) || identity.SerialNumber.Equals("Default string", StringComparison.OrdinalIgnoreCase))
                {
                    identity.SerialNumber = GetWmiProperty("Win32_BaseBoard", "SerialNumber");
                }

                identity.Manufacturer = GetWmiProperty("Win32_ComputerSystem", "Manufacturer");
                identity.Model = GetWmiProperty("Win32_ComputerSystem", "Model");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WMI Hardware metadata collection failed: {Message}", ex.Message);
            }

            // 3. Rede: IP Address primário e Endereços MAC
            try
            {
                var interfaces = NetworkInterface.GetAllNetworkInterfaces()
                    .Where(nic => nic.OperationalStatus == OperationalStatus.Up && 
                                  nic.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                    .ToList();

                foreach (var nic in interfaces)
                {
                    var mac = nic.GetPhysicalAddress()?.ToString();
                    if (!string.IsNullOrEmpty(mac) && mac.Length == 12)
                    {
                        var formattedMac = string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
                        if (!identity.MacAddresses.Contains(formattedMac))
                        {
                            identity.MacAddresses.Add(formattedMac);
                        }
                    }

                    if (string.IsNullOrEmpty(identity.IpAddress))
                    {
                        var ipProp = nic.GetIPProperties();
                        var ipv4 = ipProp.UnicastAddresses
                            .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetwork && !a.Address.ToString().StartsWith("169.254"));
                        if (ipv4 != null)
                        {
                            identity.IpAddress = ipv4.Address.ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Network adapter collection failed: {Message}", ex.Message);
            }

            return Task.FromResult(identity);
        }

        private static string GetRegistryMachineGuid()
        {
            try
            {
                using var key = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64)
                    .OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
                return key?.GetValue("MachineGuid")?.ToString() ?? Guid.NewGuid().ToString();
            }
            catch
            {
                return Guid.NewGuid().ToString();
            }
        }

        private static string GetWmiProperty(string wmiClass, string propertyName)
        {
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return string.Empty;

            try
            {
                using var searcher = new System.Management.ManagementObjectSearcher($"SELECT {propertyName} FROM {wmiClass}");
                foreach (System.Management.ManagementObject obj in searcher.Get())
                {
                    var val = obj[propertyName]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(val)) return val;
                }
            }
            catch
            {
                // Failsafe
            }
            return string.Empty;
        }
    }
}
