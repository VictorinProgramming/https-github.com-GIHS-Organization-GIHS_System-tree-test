import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function clientNetworkPlugin() {
  return {
    name: 'client-network-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/client-network', (req: any, res: any) => {
        const xForwardedFor = req.headers['x-forwarded-for'];
        let clientIp = '';
        if (typeof xForwardedFor === 'string') {
          clientIp = xForwardedFor.split(',')[0].trim();
        } else if (Array.isArray(xForwardedFor)) {
          clientIp = xForwardedFor[0].trim();
        } else {
          clientIp = req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
        }
        if (clientIp.startsWith('::ffff:')) {
          clientIp = clientIp.substring(7);
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          ip: clientIp,
          userAgent: req.headers['user-agent'] || '',
          timestamp: Date.now()
        }));
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), clientNetworkPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
