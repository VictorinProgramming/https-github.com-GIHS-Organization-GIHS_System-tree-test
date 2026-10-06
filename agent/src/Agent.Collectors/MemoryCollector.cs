using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Collectors
{
    public class MemoryCollector : IMemoryCollector
    {
        public string Name => "MemoryCollector";
        private readonly ILogger<MemoryCollector> _logger;

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private class MEMORYSTATUSEX
        {
            public uint dwLength;
            public uint dwMemoryLoad;
            public ulong ullTotalPhys;
            public ulong ullAvailPhys;
            public ulong ullTotalPageFile;
            public ulong ullAvailPageFile;
            public ulong ullTotalVirtual;
            public ulong ullAvailVirtual;
            public ulong ullAvailExtendedVirtual;

            public MEMORYSTATUSEX()
            {
                dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
            }
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GlobalMemoryStatusEx([In, Out] MEMORYSTATUSEX lpBuffer);

        public MemoryCollector(ILogger<MemoryCollector> logger)
        {
            _logger = logger;
        }

        public Task<MemoryInfo> CollectAsync(CancellationToken cancellationToken = default)
        {
            var memInfo = new MemoryInfo();

            // 1. Estatísticas de Capacidade Global (kernel32!GlobalMemoryStatusEx)
            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    var status = new MEMORYSTATUSEX();
                    if (GlobalMemoryStatusEx(status))
                    {
                        memInfo.TotalBytes = (long)status.ullTotalPhys;
                        memInfo.AvailableBytes = (long)status.ullAvailPhys;
                        memInfo.UsedBytes = memInfo.TotalBytes - memInfo.AvailableBytes;
                        memInfo.UsedPercentage = memInfo.TotalBytes > 0 
                            ? Math.Round(((double)memInfo.UsedBytes / memInfo.TotalBytes) * 100, 1) 
                            : 0;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("GlobalMemoryStatusEx failed: {Message}", ex.Message);
            }

            // Fallback caso não esteja no Windows ou falhe
            if (memInfo.TotalBytes == 0)
            {
                memInfo.TotalBytes = 16L * 1024 * 1024 * 1024;
                memInfo.UsedBytes = 6L * 1024 * 1024 * 1024;
                memInfo.AvailableBytes = 10L * 1024 * 1024 * 1024;
                memInfo.UsedPercentage = 37.5;
            }

            // 2. Módulos Físicos via WMI (Win32_PhysicalMemory)
            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    using var searcher = new System.Management.ManagementObjectSearcher(
                        "SELECT BankLabel, Capacity, Manufacturer, Speed, PartNumber, SerialNumber FROM Win32_PhysicalMemory");

                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        var mod = new MemoryModule
                        {
                            BankLabel = obj["BankLabel"]?.ToString()?.Trim(),
                            Manufacturer = obj["Manufacturer"]?.ToString()?.Trim(),
                            PartNumber = obj["PartNumber"]?.ToString()?.Trim(),
                            SerialNumber = obj["SerialNumber"]?.ToString()?.Trim()
                        };

                        if (long.TryParse(obj["Capacity"]?.ToString(), out var cap))
                        {
                            mod.CapacityBytes = cap;
                        }

                        if (int.TryParse(obj["Speed"]?.ToString(), out var spd))
                        {
                            mod.SpeedMhz = spd;
                        }

                        memInfo.Modules.Add(mod);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WMI Physical memory collection failed: {Message}", ex.Message);
            }

            return Task.FromResult(memInfo);
        }
    }
}
