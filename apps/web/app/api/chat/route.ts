import OpenAI from "openai";
import { kbSearch } from "@emed/kb";
import { buildSystemPrompt } from "./build-system-prompt";
import { runChat } from "./run-chat";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const start = Date.now();
  const { message, history = [] } = await req.json();

  if (!message?.trim()) {
    console.warn("[POST /api/chat] Rejected empty message");
    return new Response("Message is required", { status: 400 });
  }

  console.log(
    `[POST /api/chat] message="${message.slice(0, 80)}${message.length > 80 ? "…" : ""}", history=${history.length}`,
  );

  const sources = await kbSearch(message, 5);
  console.log(`[POST /api/chat] kbSearch returned ${sources.length} sources`);

  const context = sources.map((s) => `[${s.title}]\n${s.snippet}`).join("\n\n---\n\n");

  const messages = [
    { role: "system" as const, content: buildSystemPrompt(context) },
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
