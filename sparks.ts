import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  getMatchById,
  getSparkByIdForUser,
  getSparkByMatchIdForUser,
  getUserById,
  getUserId,
  listSparksForUser,
  now,
  updateSpark,
  upsertSparkRating,
} from './db';
import { generateIcebreaker } from './icebreaker';

const selectActivitySchema = z.object({ activityId: z.string() });
const rateSchema = z.object({
  stars: z.number().int().min(1).max(5),
  wouldMeetAgain: z.boolean(),
});

// Static activity + venue list - replace with DB query as you grow
const ACTIVITIES = [
  { id: 'coffee', name: 'Coffee', icon: 'coffee' },
  { id: 'study', name: 'Study session', icon: 'book' },
  { id: 'walk', name: 'Walk', icon: 'map-pin' },
];

const VENUES_BY_CAMPUS: Record<string, Array<{ activityId: string; id: string; name: string; address: string; walk_minutes: number }>> = {
  default: [
    { activityId: 'coffee', id: 'v1', name: 'Campus Cafe', address: 'Student Union, Ground Floor', walk_minutes: 5 },
    { activityId: 'study', id: 'v2', name: 'Main Library', address: 'Floor 2, Quiet Zone', walk_minutes: 3 },
    { activityId: 'walk', id: 'v3', name: 'Campus Quad Loop', address: 'Start at the main fountain', walk_minutes: 0 },
  ],
};

export async function sparkRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [(fastify as any).authenticate] };

  // GET /sparks/:matchId/activities - get activity options for a spark
  fastify.get('/:matchId/activities', auth, async (request: any, reply) => {
    const userId = getUserId(request);
    const { matchId } = request.params;

    // Get user's campus
    const user = getUserById(userId);
    const campusId = user?.campus_id || 'default';
    const venues = VENUES_BY_CAMPUS[campusId] || VENUES_BY_CAMPUS.default;

    return ACTIVITIES.map((activity) => ({
      activity,
      venue: venues.find((v) => v.activityId === activity.id) || venues[0],
    }));
  });

  // POST /sparks/:matchId/select - user picks an activity
  fastify.post('/:matchId/select', auth, async (request: any, reply) => {
    const userId = getUserId(request);
    const { matchId } = request.params;
    const { activityId } = selectActivitySchema.parse(request.body);

    // Find the spark tied to this match
    const spark = getSparkByMatchIdForUser(matchId, userId);

    if (!spark) return reply.code(404).send({ message: 'Spark not found' });

    const isUserA = spark.user_a_id === userId;
    const updateField = isUserA ? 'user_a_activity' : 'user_b_activity';

    updateSpark(spark.id, { [updateField]: activityId } as any);

    // Re-fetch to check if both have picked
    const updated = getSparkByMatchIdForUser(matchId, userId);
    const bothPicked = updated?.user_a_activity && updated?.user_b_activity;
    const sameActivity = updated?.user_a_activity === updated?.user_b_activity;

    if (bothPicked && sameActivity) {
      // Get both users' prompts for icebreaker generation
      const otherId = isUserA ? spark.user_b_id : spark.user_a_id;
      const otherUser = getUserById(otherId);
      const meUser = getUserById(userId);

      const venue = (VENUES_BY_CAMPUS.default).find((v) => v.activityId === activityId) || VENUES_BY_CAMPUS.default[0];
      const activity = ACTIVITIES.find((a) => a.id === activityId) || ACTIVITIES[0];

      // Generate a local icebreaker prompt
      const icebreaker = await generateIcebreaker(meUser, otherUser);

      // Set meet time = beginning of their overlap window
      const matchRecord = getMatchById(matchId);

      updateSpark(spark.id, {
        status: 'scheduled',
        activity_id: activityId,
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.address,
        activity_name: activity.name,
        icebreaker,
        meet_time: matchRecord?.overlap_start || now(),
      });

      return { status: 'confirmed', spark_id: spark.id };
    }

    if (bothPicked && !sameActivity) {
      return { status: 'mismatch', message: 'Different activities chosen - each gets one re-pick' };
    }

    return { status: 'waiting', spark_id: spark.id };
  });

  // GET /sparks/:sparkId - fetch a confirmed spark
  fastify.get('/:sparkId', auth, async (request: any, reply) => {
    const userId = getUserId(request);
    const { sparkId } = request.params;

    const spark = getSparkByIdForUser(sparkId, userId);

    if (!spark) return reply.code(404).send({ message: 'Spark not found' });

    const otherId = spark.user_a_id === userId ? spark.user_b_id : spark.user_a_id;
    const otherUser = getUserById(otherId);

    return {
      ...spark,
      other_user: otherUser,
      activity: { id: spark.activity_id, name: spark.activity_name },
      venue: { name: spark.venue_name, address: spark.venue_address },
    };
  });

  // GET /sparks/history - all past sparks for the user
  fastify.get('/history', auth, async (request, reply) => {
    const userId = getUserId(request);

    const sparks = listSparksForUser(userId);

    // Enrich with other user info
    const enriched = await Promise.all(
      (sparks || []).map(async (spark) => {
        const otherId = spark.user_a_id === userId ? spark.user_b_id : spark.user_a_id;
        const otherUser = getUserById(otherId);
        return {
          ...spark,
          other_user: otherUser,
          activity: { id: spark.activity_id, name: spark.activity_name },
        };
      })
    );

    return enriched;
  });

  // POST /sparks/:sparkId/rate - submit post-spark rating
  fastify.post('/:sparkId/rate', auth, async (request: any, reply) => {
    const userId = getUserId(request);
    const { sparkId } = request.params;
    const { stars, wouldMeetAgain } = rateSchema.parse(request.body);

    upsertSparkRating(sparkId, userId, stars, wouldMeetAgain);

    // Mark spark as completed if both rated
    updateSpark(sparkId, { status: 'completed' });

    return { success: true };
  });
}
