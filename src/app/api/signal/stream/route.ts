import { ensureSignalServiceStarted, subscribeToSignal } from "@/lib/signal-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Lazy-start on first request, NOT at module load (see api/signal/route.ts comment)
let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  try {
    ensureSignalServiceStarted();
  } catch (e) {
    console.error("[signal] failed to start service:", e);
  }
}

export async function GET() {
  ensureStarted();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Subscribe to live updates
      const unsubscribe = subscribeToSignal((state) => {
        send(state);
      });

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          closed = true;
        }
      }, 15000);

      // Cleanup on cancel
      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Max lifetime of 5 minutes per connection (prevents zombie streams)
      setTimeout(cleanup, 5 * 60 * 1000);
    },
    cancel() {
      // Client disconnected — cleanup happens via the closure above
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}
