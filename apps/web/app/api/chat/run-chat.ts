import OpenAI from "openai";
import { toolRegistry, tools } from "./openai-tools/tool-registry";

async function runTool(name: string, args: unknown): Promise<unknown> {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`[runTool] Unknown tool: "${name}"`);

  console.log(`[runTool] → ${name}`, args);
  try {
    const output = await tool.invoke(args);
    console.log(`[runTool] ← ${name}`, output);
    return output;
  } catch (err) {
    console.error(`[runTool] ✗ ${name} failed:`, err);
    throw err;
  }
}

const MAX_TOOL_STEPS = 5;

export async function runChat(messages: OpenAI.Chat.ChatCompletionMessageParam[], openai: OpenAI): Promise<string> {
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    console.log(`[runChat] Step ${step + 1}/${MAX_TOOL_STEPS}, history length: ${messages.length}`);

    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        stream: false,
      });
    } catch (err) {
      console.error(`[runChat] OpenAI request failed at step ${step + 1}:`, err);
      throw err;
    }

    const choice = response.choices[0];
    if (!choice) throw new Error("[runChat] No choices in OpenAI response");

    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    console.log(
      `[runChat] finish_reason="${choice.finish_reason}", tool_calls=${assistantMessage.tool_calls?.length ?? 0}`,
    );

    // No tool calls — return the text content directly
    if (!assistantMessage.tool_calls?.length || choice.finish_reason === "stop") {
      return assistantMessage.content ?? "";
    }

    // Execute each tool call and append results
    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") {
        console.warn(`[runChat] Skipping unexpected tool type: "${toolCall.type}"`);
        continue;
      }

      let args: unknown;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error(
          `[runChat] Failed to parse arguments for tool "${toolCall.function.name}": ${toolCall.function.arguments}`,
        );
      }

      const output = await runTool(toolCall.function.name, args);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(output),
      });
    }
  }

  throw new Error(`[runChat] Exceeded MAX_TOOL_STEPS (${MAX_TOOL_STEPS})`);
}
