import { extractJsonText } from "./extract-json-to-text";
import { getMcpClient } from "./get-mcp-client";

export async function saveLead(args: { name: string; email: string; summary?: string }) {
  const client = await getMcpClient();
  const result = await client.callTool({
    name: "save_lead",
    arguments: args,
  });
  return extractJsonText(result);
}
