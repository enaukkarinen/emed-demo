import { Client } from "@elastic/elasticsearch";

export const LEADS_INDEX = "emed-leads";

export async function ensureLeadsIndex(es: Client): Promise<void> {
  const exists = await es.indices.exists({ index: LEADS_INDEX });
  if (exists) return;

  await es.indices.create({
    index: LEADS_INDEX,
    mappings: {
      properties: {
        name: { type: "text" },
        email: { type: "keyword" },
        summary: { type: "text" },
        createdAt: { type: "date" },
      },
    },
  });

  console.log(`Created index: ${LEADS_INDEX}`);
}
