interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(token: string, payload: PushPayload): Promise<void> {
  if (!token) return;
  console.log('[local push]', { token, ...payload });
}

// Send to multiple tokens at once (Expo batch API)
export async function sendPushBatch(notifications: Array<{ token: string } & PushPayload>): Promise<void> {
  for (const n of notifications) {
    await sendPushToUser(n.token, n);
  }
}
