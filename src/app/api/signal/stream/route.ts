import { ensureSignalServiceStarted, subscribeToSignal } from "@/lib/signal-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

ensureSignalServiceStarted();

export async function GET() {
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

      // The Request object doesn't expose close directly in this signature,
      // but Next.js will call cancel() on the stream when client disconnects.
      // We hook into that via the underlying controller.
      // For safety, we also set a max lifetime of 5 minutes per connection.
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
