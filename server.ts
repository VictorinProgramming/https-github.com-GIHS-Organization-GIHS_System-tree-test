import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getHealthStatus,
  getClientNetwork,
  getDashboardMetrics,
  handleRunMigration,
  getSchemaStatus,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSectors,
  createSector,
  getPontoRecords,
  getPontoByUserId,
  createPontoRecord,
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  clearTickets,
  getKnowledgeArticles,
  getKnowledgeArticleById,
  createKnowledgeArticle,
  markArticleUseful,
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  deleteAllEquipment,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  handleSyncToPostgres,
  handleExportFromPostgres,
  getProviderConfig,
  setProviderConfig,
  handleLogin,
  handleSeedMasters,
  getOnCallShifts,
  getOnCallShiftById,
  getCurrentOnCallActive,
  getUpcomingOnCall,
  checkOnCallConflict,
  createOnCallShift,
  updateOnCallShift,
  deleteOnCallShift,
  auditPdfGeneration,
  getMobilityDevices,
  getMobilityDeviceById,
  createMobilityDevice,
  updateMobilityDevice,
  getMobilityVehicles,
  createMobilityVehicle,
  getMobilityAssignments,
  createMobilityAssignment,
  returnMobilityAssignment,
  getMobilityTrips,
  getMobilityTripById,
  startMobilityTrip,
  addMobilityRoutePoint,
  finishMobilityTrip,
  getMobilityMetrics,
  clearMobilityData
} from './server/routes.js';
import { checkDatabaseConnection } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  const envPort = parseInt(process.env.PORT || '', 10);
  // Avoid colliding with reverse proxies (e.g. Nginx on 8080)
  if (!isNaN(envPort) && envPort > 0 && envPort !== 8080) {
    return envPort;
  }
  return 3000;
}

const PORT = resolvePort();
const isProduction = process.env.NODE_ENV === 'production';

// Cyber-Security: Remove banner de servidor Express para evitar fingerprinting
app.disable('x-powered-by');

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cyber-Security & OWASP Defense Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  next();
});

// System & Database Administration Routes
app.get('/api/health', getHealthStatus);
app.get('/api/client-network', getClientNetwork);
app.get('/api/dashboard/metrics', getDashboardMetrics);
app.post('/api/database/migrate', handleRunMigration);
app.get('/api/database/schema-status', getSchemaStatus);

// Test PostgreSQL route
app.get('/api/db-status', async (req, res) => {
  const result = await checkDatabaseConnection();
  res.json({
    database: 'PostgreSQL',
    ...result
  });
});

// Users / Collaborators CRUD Routes
app.get('/api/users', getUsers);
app.get('/api/users/:id', getUserById);
app.post('/api/users', createUser);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);

// Sectors / Organograma Routes
app.get('/api/sectors', getSectors);
app.post('/api/sectors', createSector);

// Ponto Eletrônico (Portaria 671 MTE) CRUD Routes
app.get('/api/ponto', getPontoRecords);
app.get('/api/ponto/user/:userId', getPontoByUserId);
app.post('/api/ponto', createPontoRecord);

// Tickets / Chamados CRUD Routes
app.get('/api/tickets', getTickets);
app.post('/api/tickets/clear', clearTickets);
app.get('/api/tickets/:id', getTicketById);
app.post('/api/tickets', createTicket);
app.put('/api/tickets/:id', updateTicket);
app.delete('/api/tickets/:id', deleteTicket);

// Knowledge Base / Base de Conhecimento CRUD Routes
app.get('/api/knowledge', getKnowledgeArticles);
app.get('/api/knowledge/:id', getKnowledgeArticleById);
app.post('/api/knowledge', createKnowledgeArticle);
app.post('/api/knowledge/:id/useful', markArticleUseful);

// Tasks / Tarefas CRUD Routes
app.get('/api/tasks', getTasks);
app.get('/api/tasks/:id', getTaskById);
app.post('/api/tasks', createTask);
app.put('/api/tasks/:id', updateTask);
app.delete('/api/tasks/:id', deleteTask);

// Equipment / Patrimônio CRUD Routes
app.get('/api/equipment', getEquipment);
app.get('/api/equipment/:id', getEquipmentById);
app.post('/api/equipment', createEquipment);
app.put('/api/equipment/:id', updateEquipment);
app.delete('/api/equipment/all', deleteAllEquipment);
app.delete('/api/equipment/:id', deleteEquipment);

// Bidirectional Sync Routes: Firebase ➔ PostgreSQL ➔ Firebase
app.post('/api/database/sync-to-postgres', handleSyncToPostgres);
app.get('/api/database/export-from-postgres', handleExportFromPostgres);

// Database Provider Switcher
app.get('/api/database/provider', getProviderConfig);
app.post('/api/database/provider', setProviderConfig);

// PostgreSQL Master Authentication Routes
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/seed-masters', handleSeedMasters);

// On-Call (Sobreaviso) Management Routes
app.get('/api/on-call/shifts', getOnCallShifts);
app.get('/api/on-call/shifts/:id', getOnCallShiftById);
app.post('/api/on-call/shifts', createOnCallShift);
app.put('/api/on-call/shifts/:id', updateOnCallShift);
app.delete('/api/on-call/shifts/:id', deleteOnCallShift);
app.get('/api/on-call/active', getCurrentOnCallActive);
app.get('/api/on-call/upcoming', getUpcomingOnCall);
app.post('/api/on-call/check-conflict', checkOnCallConflict);
app.post('/api/on-call/audit-pdf', auditPdfGeneration);

// Mobility (Mobilidade Corporativa) Routes
app.get('/api/mobility/vehicles', getMobilityVehicles);
app.post('/api/mobility/vehicles', createMobilityVehicle);
app.get('/api/mobility/devices', getMobilityDevices);
app.get('/api/mobility/devices/:id', getMobilityDeviceById);
app.post('/api/mobility/devices', createMobilityDevice);
app.put('/api/mobility/devices/:id', updateMobilityDevice);
app.get('/api/mobility/assignments', getMobilityAssignments);
app.post('/api/mobility/assignments', createMobilityAssignment);
app.post('/api/mobility/assignments/:id/return', returnMobilityAssignment);
app.get('/api/mobility/trips', getMobilityTrips);
app.get('/api/mobility/trips/:id', getMobilityTripById);
app.post('/api/mobility/trips', startMobilityTrip);
app.post('/api/mobility/trips/:id/points', addMobilityRoutePoint);
app.post('/api/mobility/trips/:id/finish', finishMobilityTrip);
app.get('/api/mobility/metrics', getMobilityMetrics);
app.post('/api/mobility/clear-all', clearMobilityData);

async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProduction) {
    // Vite middleware integration in Development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    // Fallback for HTML / SPA routing in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }
      try {
        const indexHtmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexHtmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    console.log('[GIHS System] Vite middlewares mounted for development.');
  } else {
    // Production: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[GIHS System] Serving production static files from dist.');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[GIHS System] Enterprise Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GIHS System] Fatal error starting server:', err);
  process.exit(1);
});
