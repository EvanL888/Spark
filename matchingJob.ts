import { getUserById, listCampuses, listPendingMatchesSince } from './db';
import { generateDailyMatches } from './matchingEngine';
import { sendPushToUser } from './push';

export function startMatchingJob() {
  const run = async () => {
    console.log('Running local matching job...');

    const uniqueCampuses = listCampuses();

    let totalPairs = 0;
    for (const campusId of uniqueCampuses) {
      const pairs = await generateDailyMatches(campusId);
      totalPairs += pairs;
      await notifyMatchedUsers(campusId);
    }

    console.log(`Local matching complete. ${totalPairs} total pairs created.`);
  };

  run();
  setInterval(run, 6 * 60 * 60 * 1000);
}

async function notifyMatchedUsers(campusId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const matches = listPendingMatchesSince(today.toISOString());

  for (const match of matches) {
    const user = getUserById(match.user_id);
    if (!user?.push_token) continue;
    await sendPushToUser(user.push_token, {
      title: '✦ Your spark is ready',
      body: 'Someone on campus is free at the same time as you. Go check.',
      data: { screen: 'Home' },
    });
  }
}
