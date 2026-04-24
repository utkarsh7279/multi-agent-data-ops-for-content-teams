const endpoint = process.env.WORKER_ENDPOINT ?? "http://127.0.0.1:3000/api/worker/process-next";
const secret = process.env.CRON_SECRET;
const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 5000);

async function tick() {
  try {
    const headers = {};
    if (secret) {
      headers["x-cron-secret"] = secret;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`[worker-poller] ${response.status}: ${text}`);
      return;
    }

    const payload = await response.json();
    if (payload.processed) {
      console.log(`[worker-poller] processed job`, payload);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[worker-poller] waiting for API: ${message}`);
  }
}

console.log(`[worker-poller] polling ${endpoint} every ${intervalMs}ms`);
void tick();
setInterval(() => {
  void tick();
}, intervalMs);
