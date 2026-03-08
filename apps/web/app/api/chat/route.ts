import OpenAI from "openai";
import { systemPrompt } from "./build-system-prompt";
import { runChat } from "./run-chat";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const start = Date.now();
  const { message, history = [] } = await req.json();

  if (!message?.trim()) {
    console.warn("[POST /api/chat] Rejected empty message");
    return new Response("Message is required", { status: 400 });
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history,
    { role: "user" as const, content: message },
  ];

  try {
    const reply = await runChat(messages, openai);
    console.log(`[POST /api/chat] OK — ${reply.length} chars, ${Date.now() - start}ms`);
    return new Response(reply, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[POST /api/chat] runChat failed:", err);
    return new Response("Something went wrong. Please try again.", { status: 500 });
  }
}
