import { leadEvents, LEAD_SAVED_EVENT } from "../lead-events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  console.log("[GET /api/leads/stream] Client connected");

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = (data: string) =>
    writer.write(encoder.encode(data)).catch((err) => {
      console.error("[GET /api/leads/stream] Write failed:", err);
    });

  // Firefox buffers SSE responses until a minimum payload size is received
  send(": " + "x".repeat(2048) + "\n\n");

  const heartbeat = setInterval(() => send(": heartbeat\n\n"), 15_000);

  const onLead = (lead: unknown) => {
    console.log("[GET /api/leads/stream] Pushing lead event");
    send(`data: ${JSON.stringify(lead)}\n\n`);
  };

  leadEvents.on(LEAD_SAVED_EVENT, onLead);

  req.signal.addEventListener("abort", () => {
    console.log("[GET /api/leads/stream] Client disconnected");
    clearInterval(heartbeat);
    leadEvents.off(LEAD_SAVED_EVENT, onLead);
    writer.close();
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
