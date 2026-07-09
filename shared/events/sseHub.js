// In-memory registry of open Server-Sent-Events connections, keyed by user
// ID, so a notification can be pushed to the exact signed-in user the
// instant it's created — no 30s polling delay on the client. Deliberately
// simple/in-process: fine for a single Node instance. If this app is ever
// run as multiple instances behind a load balancer, replace this with a
// shared pub/sub (Redis, etc.) — same publish()/subscribe() shape.
const connections = new Map(); // userId (string) -> Set<express.Response>

export function subscribe(userId, res) {
  const id = String(userId);
  if (!connections.has(id)) connections.set(id, new Set());
  connections.get(id).add(res);
}

export function unsubscribe(userId, res) {
  const id = String(userId);
  const set = connections.get(id);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) connections.delete(id);
}

/** Push a named SSE event with a JSON payload to every open connection for this user, if any. */
export function publish(userId, event, payload) {
  if (!userId) return;
  const id = String(userId);
  const set = connections.get(id);
  if (!set || set.size === 0) return;
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try { res.write(data); } catch { /* connection likely already gone */ }
  }
}
