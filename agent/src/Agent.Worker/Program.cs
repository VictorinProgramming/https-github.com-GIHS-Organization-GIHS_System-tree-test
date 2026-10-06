using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using GIHS.Agent.Core.Interfaces;
using GIHS.Agent.Collectors;
using GIHS.Agent.Infrastructure.Configuration;
using GIHS.Agent.Infrastructure.Http;
using GIHS.Agent.Infrastructure.Services;
using GIHS.Agent.Infrastructure.Storage;

namespace GIHS.Agent.Worker
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            host.Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseWindowsService(options =>
                {
                    options.ServiceName = "GIHS_Inventory_Agent";
                })
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                    config.AddJsonFile($"appsettings.{hostingContext.HostingEnvironment.EnvironmentName}.json", optional: true);
                    config.AddEnvironmentVariables(prefix: "GIHS_AGENT_");
                    config.AddCommandLine(args);
                })
                .ConfigureLogging((context, logging) =>
                {
                    logging.ClearProviders();
                    logging.AddConsole();
                    logging.AddDebug();

                    if (OperatingSystem.IsWindows())
                    {
                        logging.AddEventLog(settings =>
                        {
                            settings.SourceName = "GIHS Inventory Agent";
                            settings.LogName = "Application";
                        });
                    }
                })
                .ConfigureServices((hostContext, services) =>
                {
                    // 1. Configurações
                    services.Configure<AgentOptions>(
                        hostContext.Configuration.GetSection(AgentOptions.SectionName));

                    // 2. HttpClient com DI
                    services.AddHttpClient<IApiClient, AgentApiClient>();

                    // 3. Fila Offline SQLite
                    services.AddSingleton<IOfflineQueueService, SqliteOfflineQueue>();

                    // 4. Coletores Técnicos Modulares Independentes
                    services.AddTransient<IComputerIdentityCollector, ComputerIdentityCollector>();
                    services.AddTransient<IOperatingSystemCollector, OperatingSystemCollector>();
                    services.AddTransient<IMemoryCollector, MemoryCollector>();
                    services.AddTransient<IStorageCollector, StorageCollector>();
                    services.AddTransient<ISoftwareCollector, SoftwareCollector>();
                    services.AddTransient<ISecurityCollector, SecurityCollector>();

                    // 5. Orquestrador de Coleta
                    services.AddTransient<IInventoryOrchestrator, InventoryOrchestrator>();

                    // 6. Worker Windows Service de Segundo Plano
                    services.AddHostedService<Worker>();
                });
    }
}
