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
        summary: z.string().describe("A brief summary of what the user discussed and their interest in the programme"),
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
