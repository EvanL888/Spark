import { getSparkById, getSparkRating } from './db';
import { sendPushToUser } from './push';

const timeouts = new Map<string, NodeJS.Timeout>();

export function startPostSparkJob() {
  console.log('Local post-spark reminder job started');
  return true;
}

// Call this when a spark is confirmed to schedule a rating reminder
export async function scheduleRatingReminder(
  sparkId: string,
  userId: string,
  pushToken: string,
  meetTime: string
) {
  // Send reminder 30 minutes after scheduled meet time
  const delay = new Date(meetTime).getTime() + 30 * 60 * 1000 - Date.now();
  if (delay < 0) return; // meet time already passed

  if (timeouts.has(`${sparkId}:${userId}`)) return;
  const timeout = setTimeout(async () => {
    const spark = getSparkById(sparkId);
    const existingRating = getSparkRating(sparkId, userId);

    if (spark?.status === 'scheduled' && !existingRating) {
      await sendPushToUser(pushToken, {
        title: 'How was your spark?',
        body: 'Take 10 seconds to rate your meetup - it improves your future matches.',
        data: { screen: 'History', sparkId },
      });
    }

    timeouts.delete(`${sparkId}:${userId}`);
  }, delay);

  timeouts.set(`${sparkId}:${userId}`, timeout);
}
