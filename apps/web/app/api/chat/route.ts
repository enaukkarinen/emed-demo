import OpenAI from "openai";
import { kbSearch } from "@emed/kb";
import { buildSystemPrompt } from "./build-system-prompt";
import { runChat } from "./run-chat";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();

  if (!message?.trim()) {
    return new Response("Message is required", { status: 400 });
  }

  const sources = await kbSearch(message, 5);
  const context = sources.map((s) => `[${s.title}]\n${s.snippet}`).join("\n\n---\n\n");

  const messages = [
    { role: "system" as const, content: buildSystemPrompt(context) },
    ...history,
    { role: "user" as const, content: message },
  ];

  const reply = await runChat(messages, openai);

  return new Response(reply, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
