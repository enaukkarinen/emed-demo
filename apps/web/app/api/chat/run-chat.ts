import OpenAI from "openai";
import { toolRegistry, tools } from "./openai-tools/tool-registry";

async function runTool(name: string, args: any): Promise<any> {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.invoke(args);
}


const MAX_TOOL_STEPS = 5;

export async function runChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  openai: OpenAI
): Promise<string> {
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      stream: false,
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    messages.push(assistantMessage);

    // No tool calls — return the text content directly
    if (!assistantMessage.tool_calls?.length || choice.finish_reason === "stop") {
      return assistantMessage.content ?? "";
    }

    // Execute each tool call and append results
    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") continue;
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      const output = await runTool(name, args);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(output),
      });
    }
  }

  throw new Error("Tool call limit exceeded");
}
