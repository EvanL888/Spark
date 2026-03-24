import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';

import { profileRoutes } from './profile';
import { calendarRoutes } from './calendar';
import { matchRoutes } from './matches';
import { sparkRoutes } from './sparks';
import { startMatchingJob } from './matchingJob';
import { startPostSparkJob } from './postSparkJob';
import { getUserId, initDb } from './db';

const server = Fastify({ logger: { level: 'info' } });

// Plugins
server.register(cors, {
  origin: true,
  credentials: true,
});

// Auth decorator - attaches a local user id to each request
server.decorate('authenticate', async (request: any, reply: any) => {
  request.user = { id: getUserId(request) };
});

// Routes
server.register(profileRoutes, { prefix: '/profile' });
server.register(calendarRoutes, { prefix: '/calendar' });
server.register(matchRoutes, { prefix: '/matches' });
server.register(sparkRoutes, { prefix: '/sparks' });

// Health check
server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

// Start
const start = async () => {
  try {
    initDb();
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Spark API running on port ${port}`);

    // Start background jobs
    startMatchingJob();
    startPostSparkJob();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
