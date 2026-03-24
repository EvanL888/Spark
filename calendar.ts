import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUserId, replaceAvailability } from './db';

const syncSchema = z.object({
  windows: z.array(z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  })).min(0).max(100),
});

export async function calendarRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [(fastify as any).authenticate] };

  // POST /calendar/sync - receive free windows from the app
  fastify.post('/sync', auth, async (request, reply) => {
    const userId = getUserId(request);
    const { windows } = syncSchema.parse(request.body);

    const count = replaceAvailability(userId, windows);
    return { synced: count };
  });
}
