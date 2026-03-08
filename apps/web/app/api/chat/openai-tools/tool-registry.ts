import OpenAI from "openai";
import { getMcpClient } from "../mcp/get-mcp-client";

export type ToolDefinition = {
  openai: OpenAI.Chat.ChatCompletionTool;
  invoke: (args: any) => Promise<any>;
};

export const toolRegistry: Record<string, ToolDefinition> = {
  save_lead: {
    openai: {
      type: "function",
      function: {
        name: "save_lead",
        description:
          "Save a prospective patient's contact details once you have collected their name and email address. Call this only after both name and email have been provided by the user.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "The user's full name" },
            email: { type: "string", description: "The user's email address" },
            summary: {
              type: "string",
              description: "A brief summary of what the user discussed and their interest in the programme",
            },
          },
          required: ["name", "email", "summary"],
          additionalProperties: false,
        },
        strict: false,
      },
    },
    invoke: async (args) => {
      const client = await getMcpClient();
      const result = await client.callTool({ name: "save_lead", arguments: args });
      const text = (result.content as any[])?.[0]?.text ?? "{}";
      return JSON.parse(text);
    },
  },
};

export const tools = Object.values(toolRegistry).map((t) => t.openai);
