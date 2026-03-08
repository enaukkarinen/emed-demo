import { kbSearch } from "@emed/kb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();

  if (!message?.trim()) {
    return new Response("Message is required", { status: 400 });
  }

  // Retrieve relevant chunks from Elasticsearch
  const sources = await kbSearch(message, 5);
  const context = sources.map((s) => `[${s.title}]\n${s.snippet}`).join("\n\n---\n\n");

  const systemPrompt = `You are a helpful assistant for eMed, a clinician-led weight management programme focused on GLP-1 medications such as Wegovy and Mounjaro.

Answer the user's question using the context below. Be clear, accurate, and reassuring. If the context does not contain enough information to answer confidently, say so and suggest the user contact the eMed clinical team.

Never provide specific medical advice or tell a user whether they personally are eligible — always direct clinical decisions to a licensed clinician.

IMPORTANT: If the user wants to sign up or register interest for the weight management programme: Just say 'TODO'

CONTEXT:
${context}`;

  // Build message history for multi-turn conversation
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true,
  });

  // Stream tokens back to the client as they arrive
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          controller.enqueue(encoder.encode(token));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
