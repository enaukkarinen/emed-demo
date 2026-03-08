import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { kbSearch } from "@emed/kb";

export function registerSearchKnowledgeBaseTool(mcp: McpServer) {
  mcp.registerTool(
    "search_knowledge_base",
    {
      description:
        "Search the eMed knowledge base using semantic (kNN) vector search. Returns the top-k most relevant chunks from the knowledge base covering GLP-1 medications, eligibility, pricing, side effects, and programme details.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe(
            "A concise, self-contained search query. Rephrase conversational questions into explicit queries — e.g. 'semaglutide side effects' rather than 'what about side effects?'",
          ),
        topK: z.number().int().positive().max(20).default(5).describe("The number of top results to return"),
      }),
    },
    async ({ query, topK }) => {
      const results = await kbSearch(query, topK);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results),
          },
        ],
      };
    },
  );
}
