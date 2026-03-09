import OpenAI from "openai";
import { toolRegistry, tools } from "./openai-tools/tool-registry";

/**
 * Executes a series of tool calls and returns their results.
 */
async function executeToolCalls(toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]) {
  const results: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];
  for (const tc of toolCalls) {
    if (tc.type !== "function") {
      console.warn(`[executeToolCalls] Skipping unsupported tool call type: ${tc.type}`);
      continue;
    }

    let args: unknown;
    try {
      args = JSON.parse(tc.function.arguments);
    } catch (error) {
      throw new Error(
        `[executeToolCalls] Failed to parse arguments for tool "${tc.function.name}": ${tc.function.arguments}`,
        { cause: error },
      );
    }

    const tool = toolRegistry[tc.function.name];
    if (!tool) throw new Error(`[executeToolCalls] Unknown tool: "${tc.function.name}"`);

    const output = await tool.invoke(args);
    console.log(`[executeToolCalls] ← ${tc.function.name}`, output);

    results.push({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify(output),
    });
  }
  return results;
}

const MAX_TOOL_STEPS = 5;

/**
 * Runs a chat conversation with potential tool calls.
 * The function will keep sending the conversation history to OpenAI until either the model stops or we reach MAX_TOOL_STEPS.
 * @param messages
 * @param openai
 * @returns
 */
export async function runChat(messages: OpenAI.Chat.ChatCompletionMessageParam[], openai: OpenAI) {
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

    const { message, finish_reason } = choice;
    console.log(`[runChat] finish_reason="${finish_reason}", tool_calls=${message.tool_calls?.length ?? 0}`);

    messages.push(message);

    const isDone = !message.tool_calls?.length || finish_reason === "stop";
    if (isDone) return message.content ?? "";

    const toolResults = await executeToolCalls(
      message.tool_calls! /* isDone check ensures tool_calls is not undefined */,
    );
    messages.push(...toolResults);
  }

  throw new Error(`[runChat] Exceeded MAX_TOOL_STEPS (${MAX_TOOL_STEPS})`);
}
