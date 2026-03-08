import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerSaveLeadTool } from "./tools/save-lead";

const PORT = Number(process.env.MCP_PORT ?? 3333);
const MCP_AUTH_TOKEN = (process.env.MCP_AUTH_TOKEN ?? "").trim();

const mcp = new McpServer({
  name: "emed-mcp",
  version: "1.0.0",
});

registerSaveLeadTool(mcp);

const app = express();

/**
 * IMPORTANT: Do NOT use express.json() on /mcp routes.
 * StreamableHTTPServerTransport reads the raw request stream.
 */
function requireAuth(req: express.Request, res: express.Response): boolean {
  if (!MCP_AUTH_TOKEN) return true; // auth disabled when token not set

  const auth = (req.header("authorization") ?? "").trim();
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth;

  if (token === MCP_AUTH_TOKEN) return true;

  res.status(401).send("Unauthorized");
  return false;
}

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

await mcp.connect(transport);

app.get("/mcp", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("GET /mcp failed:", err);
    if (!res.headersSent) res.status(500).send("MCP GET failed");
  }
});

app.post("/mcp", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("POST /mcp failed:", err);
    if (!res.headersSent) res.status(500).send("MCP POST failed");
  }
});

app.listen(PORT, () => {
  console.log(`eMed MCP server listening on http://localhost:${PORT}/mcp`);
});
