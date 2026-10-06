using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Core.Models;

namespace GIHS.Agent.Collectors
{
    public class StorageCollector : IStorageCollector
    {
        public string Name => "StorageCollector";
        private readonly ILogger<StorageCollector> _logger;

        public StorageCollector(ILogger<StorageCollector> logger)
        {
            _logger = logger;
        }

        public Task<StorageInfo> CollectAsync(CancellationToken cancellationToken = default)
        {
            var storage = new StorageInfo();

            // 1. Volumes Lógicos e Partições (DriveInfo)
            try
            {
                var drives = DriveInfo.GetDrives();
                foreach (var d in drives)
                {
                    if (!d.IsReady) continue;
                    if (d.DriveType != DriveType.Fixed && d.DriveType != DriveType.Removable) continue;

                    try
                    {
                        var total = d.TotalSize;
                        var free = d.AvailableFreeSpace;
                        var used = total - free;
                        var pct = total > 0 ? Math.Round(((double)used / total) * 100, 1) : 0;

                        storage.Volumes.Add(new VolumeInfo
                        {
                            DriveLetter = d.Name.TrimEnd('\\'),
                            FileSystem = d.DriveFormat,
                            TotalBytes = total,
                            UsedBytes = used,
                            FreeBytes = free,
                            UsedPercentage = pct
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("Drive access failed for {Name}: {Message}", d.Name, ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("DriveInfo collection failed: {Message}", ex.Message);
            }

            // 2. Discos Físicos via WMI (Win32_DiskDrive)
            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    using var searcher = new System.Management.ManagementObjectSearcher(
                        "SELECT Model, SerialNumber, Manufacturer, InterfaceType, MediaType, Size FROM Win32_DiskDrive");

                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        var disk = new PhysicalDisk
                        {
                            Model = obj["Model"]?.ToString()?.Trim(),
                            SerialNumber = obj["SerialNumber"]?.ToString()?.Trim(),
                            Manufacturer = obj["Manufacturer"]?.ToString()?.Trim(),
                            InterfaceType = obj["InterfaceType"]?.ToString()?.Trim(),
                            MediaType = obj["MediaType"]?.ToString()?.Trim()
                        };

                        if (long.TryParse(obj["Size"]?.ToString(), out var sizeBytes))
                        {
                            disk.TotalCapacityBytes = sizeBytes;
                        }

                        // Identificação inteligente de SSD / NVMe
                        if (disk.Model != null && (disk.Model.Contains("NVMe", StringComparison.OrdinalIgnoreCase) || 
                                                   disk.Model.Contains("SSD", StringComparison.OrdinalIgnoreCase)))
                        {
                            disk.MediaType = "SSD (Solid State Drive)";
                        }

                        storage.PhysicalDisks.Add(disk);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WMI Physical drive collection failed: {Message}", ex.Message);
            }

            return Task.FromResult(storage);
        }
    }
}
