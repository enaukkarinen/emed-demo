export function extractJsonText(toolResult: any): any {
  if (!toolResult || !Array.isArray(toolResult.content)) {
    return null;
  }

  // MCP tools usually return:
  // { content: [{ type: "text", text: "..." }] }
  const textBlock = toolResult.content.find((c: any) => c?.type === "text" && typeof c.text === "string");

  if (!textBlock) return null;

  try {
    return JSON.parse(textBlock.text);
  } catch {
    // If it's not valid JSON, return the raw text safely
    return { text: textBlock.text };
  }
}
