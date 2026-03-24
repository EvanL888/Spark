import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createSpark, findAcceptedOtherMatch, getMatchByIdForUser, getTodayMatchForUser, getUserById, getUserId, now, updateMatch } from './db';

const respondSchema = z.object({
  action: z.enum(['accept', 'pass']),
});

export async function matchRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [(fastify as any).authenticate] };

  // GET /matches/today - get today's match card
  fastify.get('/today', auth, async (request, reply) => {
    const userId = getUserId(request);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const match = getTodayMatchForUser(userId);
    if (!match) return reply.code(404).send({ message: 'No match today' });

    const user = getUserById(match.matched_user_id);

    return {
      id: match.id,
      match_score: match.match_score,
      overlap_start: match.overlap_start,
      overlap_end: match.overlap_end,
      shared_interests: match.shared_interests,
      status: match.status,
      expires_at: match.expires_at,
      created_at: match.created_at,
      user,
    };
  });

  // POST /matches/:id/respond - accept or pass
  fastify.post('/:id/respond', auth, async (request: any, reply) => {
    const userId = getUserId(request);
    const { id } = request.params;
    const { action } = respondSchema.parse(request.body);

    // Verify this match belongs to the user
    const match = getMatchByIdForUser(id, userId);
    if (!match) return reply.code(404).send({ message: 'Match not found' });
    if (match.status !== 'pending') return reply.code(409).send({ message: 'Match already responded to' });

    // Update status
    updateMatch(id, { status: action === 'accept' ? 'accepted' : 'passed', responded_at: now() });

    // If accepted, check if the other side also accepted -> create spark
    if (action === 'accept') {
      const otherMatch = findAcceptedOtherMatch(userId, match.matched_user_id);
      if (otherMatch) {
        const spark = createSpark({
          match_a_id: id,
          match_b_id: otherMatch.id,
          user_a_id: userId,
          user_b_id: match.matched_user_id,
          status: 'activity_pending',
        });
        return { status: 'matched', spark_id: spark.id };
      }
    }

    return { status: action === 'accept' ? 'waiting' : 'passed' };
  });
}
