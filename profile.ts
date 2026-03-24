import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUserId, getUserById, now, upsertUser, updateUser } from './db';

const createProfileSchema = z.object({
  first_name: z.string().min(2).max(30),
  interests: z.array(z.string()).min(3).max(6),
  prompts: z.array(z.object({
    question_id: z.string(),
    question: z.string(),
    answer: z.string().min(5).max(120),
  })).min(2).max(3),
});

const updateProfileSchema = createProfileSchema.partial().extend({
  push_token: z.string().optional(),
});

export async function profileRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [(fastify as any).authenticate] };

  // GET /profile - fetch own profile
  fastify.get('/', auth, async (request, reply) => {
    const userId = getUserId(request);
    const row = getUserById(userId);
    if (!row) return reply.code(404).send({ message: 'Profile not found' });
    return row;
  });

  // POST /profile - create profile after first sign-in
  fastify.post('/', auth, async (request, reply) => {
    const userId = getUserId(request);
    const body = createProfileSchema.parse(request.body);

    const email = `user-${userId.slice(0, 6)}@spark.local`;
    const existing = getUserById(userId);
    const payload = {
      id: userId,
      email,
      first_name: body.first_name,
      university: 'Local University',
      campus_id: 'local-campus',
      interests: body.interests,
      prompts: body.prompts,
      push_token: existing?.push_token || null,
      created_at: existing?.created_at || now(),
      updated_at: now(),
    };

    upsertUser(payload);
    return reply.code(201).send(payload);
  });

  // PATCH /profile - update profile fields
  fastify.patch('/', auth, async (request, reply) => {
    const userId = getUserId(request);
    const body = updateProfileSchema.parse(request.body);

    const row = getUserById(userId);
    if (!row) return reply.code(404).send({ message: 'Profile not found' });

    const updated = updateUser(userId, {
      first_name: body.first_name ?? row.first_name,
      interests: body.interests ?? row.interests,
      prompts: body.prompts ?? row.prompts,
      push_token: body.push_token ?? row.push_token,
      updated_at: now(),
    });

    return updated;
  });
}
