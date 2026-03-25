import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { profileRoutes } from './profile';
import { calendarRoutes } from './calendar';
import { matchRoutes } from './matches';
import { sparkRoutes } from './sparks';
import { startMatchingJob } from './matchingJob';
import { startPostSparkJob } from './postSparkJob';
import { getUserId, initDb, listUsers } from './db';

const server = Fastify({ logger: { level: 'info' } });
const publicDir = path.join(process.cwd(), 'public');

function sendStaticFile(reply: any, fileName: string, contentType: string) {
  const filePath = path.join(publicDir, fileName);
  if (!fs.existsSync(filePath)) {
    return reply.code(404).send({ message: 'File not found' });
  }

  return reply.type(contentType).send(fs.readFileSync(filePath, 'utf-8'));
}

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

server.get('/', async (_, reply) => sendStaticFile(reply, 'index.html', 'text/html; charset=utf-8'));
server.get('/app.js', async (_, reply) => sendStaticFile(reply, 'app.js', 'application/javascript; charset=utf-8'));
server.get('/styles.css', async (_, reply) => sendStaticFile(reply, 'styles.css', 'text/css; charset=utf-8'));
server.get('/favicon.ico', async (_, reply) => reply.code(204).send());

server.get('/meta/demo-users', async () => {
  return listUsers().map((user) => ({
    id: user.id,
    first_name: user.first_name,
    email: user.email,
    interests: user.interests,
  }));
});

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
