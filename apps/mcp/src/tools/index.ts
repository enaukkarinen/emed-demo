import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerSaveLeadTool } from "./save-lead";
import { registerSearchKnowledgeBaseTool } from "./search-knowledge-base";

export function registerTools(mcp: McpServer) {
  registerSaveLeadTool(mcp);
  registerSearchKnowledgeBaseTool(mcp);
}
