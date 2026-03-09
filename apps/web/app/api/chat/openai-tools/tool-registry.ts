import OpenAI from "openai";
import { getMcpClient } from "../mcp/get-mcp-client";

export type ToolDefinition = {
  openai: OpenAI.Chat.ChatCompletionTool;
  invoke: (args: any) => Promise<any>;
};

/*
 Reminder: OpenAI descriptions should be written from the model's perspective, describing when and how to call the tool.
 */
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
              description:
                "2-3 sentences covering: the user's reason for interest in the programme, any relevant medical context they mentioned (e.g. current weight, conditions, medications), and any specific questions or concerns they raised.",
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

      const uuid = crypto.randomUUID();

      const result = await client.callTool({
        name: "save_lead",
        arguments: {
          ...args,
          id: uuid,
        },
      });
      const text = (result.content as any[])?.[0]?.text ?? "{}";
      return JSON.parse(text);
    },
  },
  search_knowledge_base: {
    openai: {
      type: "function",
      function: {
        name: "search_knowledge_base",
        description:
          "Search the eMed knowledge base for GLP-1 programme information. Use this tool whenever the user asks about eligibility, medication, pricing, side effects, the consultation process, or how the programme works. Always call this before answering — do not rely on general knowledge about GLP-1 or weight loss medication, as answers must come from eMed's specific programme details.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "A concise, self-contained search query optimised for retrieval. Rephrase the user's question if needed — for example 'What are the side effects of semaglutide?' rather than 'what about side effects?'",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
        strict: false,
      },
    },
    invoke: async (args) => {
      const client = await getMcpClient();
      const result = await client.callTool({ name: "search_knowledge_base", arguments: args });
      const text = (result.content as any[])?.[0]?.text ?? "{}";
      return JSON.parse(text);
    },
  },
};

export const tools = Object.values(toolRegistry).map((t) => t.openai);
