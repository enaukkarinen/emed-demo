import { Client } from "@elastic/elasticsearch";

export const KB_INDEX = "emed-kb";

export async function ensureKbIndex(es: Client): Promise<void> {
  const exists = await es.indices.exists({ index: KB_INDEX });
  if (exists) return;

  await es.indices.create({
    index: KB_INDEX,
    mappings: {
      properties: {
        chunkId: { type: "keyword" },
        title: { type: "text" },
        source: { type: "keyword" },
        content: { type: "text" },
        embedding: {
          type: "dense_vector",
          dims: 1536,
          index: true,
          similarity: "cosine",
        },
      },
    },
  });

  console.log(`Created index: ${KB_INDEX}`);
}
