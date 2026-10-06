using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace GIHS.Agent.Core.Models
{
    /// <summary>
    /// Identificação única e imutável da máquina física/virtual no ambiente corporativo
    /// </summary>
    public class AgentIdentity
    {
        [JsonPropertyName("hostname")]
        public string Hostname { get; set; } = string.Empty;

        [JsonPropertyName("machine_uuid")]
        public string MachineUuid { get; set; } = string.Empty;

        [JsonPropertyName("serial_number")]
        public string? SerialNumber { get; set; }

        [JsonPropertyName("manufacturer")]
        public string? Manufacturer { get; set; }

        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("domain_workgroup")]
        public string? DomainWorkgroup { get; set; }

        [JsonPropertyName("current_user")]
        public string? CurrentUser { get; set; }

        [JsonPropertyName("ip_address")]
        public string? IpAddress { get; set; }

        [JsonPropertyName("mac_addresses")]
        public List<string> MacAddresses { get; set; } = new();
    }

    /// <summary>
    /// Informações detalhadas do Sistema Operacional Windows
    /// </summary>
    public class OperatingSystemInfo
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "Windows";

        [JsonPropertyName("edition")]
        public string? Edition { get; set; }

        [JsonPropertyName("version")]
        public string? Version { get; set; }

        [JsonPropertyName("build")]
        public string? Build { get; set; }

        [JsonPropertyName("architecture")]
        public string Architecture { get; set; } = "x64";

        [JsonPropertyName("installed_at")]
        public string? InstalledAt { get; set; }

        [JsonPropertyName("last_boot")]
        public string? LastBoot { get; set; }
    }

    /// <summary>
    /// Módulo físico de memória RAM (DIMM / SO-DIMM)
    /// </summary>
    public class MemoryModule
    {
        [JsonPropertyName("bank_label")]
        public string? BankLabel { get; set; }

        [JsonPropertyName("capacity_bytes")]
        public long CapacityBytes { get; set; }

        [JsonPropertyName("manufacturer")]
        public string? Manufacturer { get; set; }

        [JsonPropertyName("speed_mhz")]
        public int? SpeedMhz { get; set; }

        [JsonPropertyName("part_number")]
        public string? PartNumber { get; set; }

        [JsonPropertyName("serial_number")]
        public string? SerialNumber { get; set; }
    }

    /// <summary>
    /// Telemetria e capacidade de memória RAM
    /// </summary>
    public class MemoryInfo
    {
        [JsonPropertyName("total_bytes")]
        public long TotalBytes { get; set; }

        [JsonPropertyName("used_bytes")]
        public long UsedBytes { get; set; }

        [JsonPropertyName("available_bytes")]
        public long AvailableBytes { get; set; }

        [JsonPropertyName("used_percentage")]
        public double UsedPercentage { get; set; }

        [JsonPropertyName("modules")]
        public List<MemoryModule> Modules { get; set; } = new();
    }

    /// <summary>
    /// Disco físico instalado na controladora
    /// </summary>
    public class PhysicalDisk
    {
        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("serial_number")]
        public string? SerialNumber { get; set; }

        [JsonPropertyName("manufacturer")]
        public string? Manufacturer { get; set; }

        [JsonPropertyName("media_type")]
        public string? MediaType { get; set; } // SSD, NVMe, HDD

        [JsonPropertyName("interface_type")]
        public string? InterfaceType { get; set; } // PCIe, SATA, USB

        [JsonPropertyName("total_capacity_bytes")]
        public long TotalCapacityBytes { get; set; }
    }

    /// <summary>
    /// Volume lógico / partição com letra de unidade
    /// </summary>
    public class VolumeInfo
    {
        [JsonPropertyName("drive_letter")]
        public string DriveLetter { get; set; } = string.Empty;

        [JsonPropertyName("file_system")]
        public string? FileSystem { get; set; }

        [JsonPropertyName("total_bytes")]
        public long TotalBytes { get; set; }

        [JsonPropertyName("used_bytes")]
        public long UsedBytes { get; set; }

        [JsonPropertyName("free_bytes")]
        public long FreeBytes { get; set; }

        [JsonPropertyName("used_percentage")]
        public double UsedPercentage { get; set; }
    }

    /// <summary>
    /// Armazenamento consolidado (discos físicos + volumes)
    /// </summary>
    public class StorageInfo
    {
        [JsonPropertyName("physical_disks")]
        public List<PhysicalDisk> PhysicalDisks { get; set; } = new();

        [JsonPropertyName("volumes")]
        public List<VolumeInfo> Volumes { get; set; } = new();
    }

    /// <summary>
    /// Aplicativo instalado no sistema operacional
    /// </summary>
    public class InstalledSoftware
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("version")]
        public string? Version { get; set; }

        [JsonPropertyName("publisher")]
        public string? Publisher { get; set; }

        [JsonPropertyName("install_date")]
        public string? InstallDate { get; set; }

        [JsonPropertyName("installed_for_user")]
        public string? InstalledForUser { get; set; }

        [JsonPropertyName("install_location")]
        public string? InstallLocation { get; set; }

        [JsonPropertyName("uninstall_string")]
        public string? UninstallString { get; set; }

        [JsonPropertyName("architecture")]
        public string Architecture { get; set; } = "x64";
    }

    /// <summary>
    /// Indicadores de postura de segurança cibernética
    /// </summary>
    public class SecurityInfo
    {
        [JsonPropertyName("antivirus")]
        public AntivirusStatus? Antivirus { get; set; }

        [JsonPropertyName("firewall")]
        public FirewallStatus? Firewall { get; set; }

        [JsonPropertyName("secure_boot")]
        public SecureBootStatus? SecureBoot { get; set; }

        [JsonPropertyName("bitlocker")]
        public BitLockerStatus? BitLocker { get; set; }
    }

    public class AntivirusStatus
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("enabled")]
        public bool Enabled { get; set; }

        [JsonPropertyName("up_to_date")]
        public bool UpToDate { get; set; }
    }

    public class FirewallStatus
    {
        [JsonPropertyName("enabled")]
        public bool Enabled { get; set; }
    }

    public class SecureBootStatus
    {
        [JsonPropertyName("enabled")]
        public bool Enabled { get; set; }
    }

    public class BitLockerStatus
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "Unknown";

        [JsonPropertyName("protection_enabled")]
        public bool ProtectionEnabled { get; set; }
    }

    /// <summary>
    /// Payload completo transmitido ao Backend via HTTPS POST
    /// </summary>
    public class FullInventoryPayload
    {
        [JsonPropertyName("agent_id")]
        public string AgentId { get; set; } = string.Empty;

        [JsonPropertyName("agent_version")]
        public string AgentVersion { get; set; } = "1.0.0";

        [JsonPropertyName("collected_at")]
        public string CollectedAt { get; set; } = DateTime.UtcNow.ToString("o");

        [JsonPropertyName("identity")]
        public AgentIdentity Identity { get; set; } = new();

        [JsonPropertyName("operating_system")]
        public OperatingSystemInfo OperatingSystem { get; set; } = new();

        [JsonPropertyName("memory")]
        public MemoryInfo Memory { get; set; } = new();

        [JsonPropertyName("storage")]
        public StorageInfo Storage { get; set; } = new();

        [JsonPropertyName("software")]
        public List<InstalledSoftware> Software { get; set; } = new();

        [JsonPropertyName("security")]
        public SecurityInfo Security { get; set; } = new();
    }

    /// <summary>
    /// Payload leve de Heartbeat periódico
    /// </summary>
    public class HeartbeatPayload
    {
        [JsonPropertyName("agent_id")]
        public string AgentId { get; set; } = string.Empty;

        [JsonPropertyName("machine_uuid")]
        public string MachineUuid { get; set; } = string.Empty;

        [JsonPropertyName("hostname")]
        public string Hostname { get; set; } = string.Empty;

        [JsonPropertyName("agent_version")]
        public string AgentVersion { get; set; } = "1.0.0";

        [JsonPropertyName("current_user")]
        public string? CurrentUser { get; set; }
    }

    public class HeartbeatResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "ok";

        [JsonPropertyName("next_heartbeat_interval_sec")]
        public int NextHeartbeatIntervalSec { get; set; } = 60;

        [JsonPropertyName("request_full_inventory")]
        public bool RequestFullInventory { get; set; }

        [JsonPropertyName("server_time")]
        public string? ServerTime { get; set; }
    }

    public class InventoryResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("agentId")]
        public string? AgentId { get; set; }

        [JsonPropertyName("assetId")]
        public string? AssetId { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }
}
