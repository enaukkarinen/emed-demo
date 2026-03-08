import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ensureLeadsIndex, getEsClient, LEADS_INDEX } from "@emed/es";

export function registerSaveLeadTool(mcp: McpServer) {
  mcp.registerTool(
    "save_lead",
    {
      description:
        "Save a prospective patient's contact details and a summary of their conversation. Call this once you have collected the user's name and email address.",
      inputSchema: z.object({
        name: z.string().min(1).describe("The user's full name"),
        email: z.string().email().describe("The user's email address"),
        summary: z
          .string()
          .describe(
            "2-3 sentences covering the user's reason for interest, any relevant medical context (e.g. current weight, conditions, medications), and any specific questions or concerns they raised",
          ),
      }),
    },
    async ({ name, email, summary }) => {
      const es = getEsClient();
      await ensureLeadsIndex(es);

      await es.index({
        index: LEADS_INDEX,
        document: {
          name,
          email,
          summary,
          createdAt: new Date().toISOString(),
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, name, email }),
          },
        ],
      };
    },
  );
}
