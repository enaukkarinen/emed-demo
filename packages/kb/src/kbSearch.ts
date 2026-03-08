import "dotenv/config";
import OpenAI from "openai";

import { getEsClient, KB_INDEX } from "@emed/es";

export type KbSearchResult = {
  chunkId: string;
  title: string;
  source: string;
  snippet: string;
  score: number;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function kbSearch(query: string, topK = 5): Promise<KbSearchResult[]> {
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryVector = emb.data[0].embedding;
  const es = getEsClient();

  const response = await es.search({
    index: KB_INDEX,
    size: topK,
    knn: {
      field: "embedding",
      query_vector: queryVector,
      k: topK,
      num_candidates: 50,
    },
    _source: ["chunkId", "title", "source", "content"],
  });

  return response.hits.hits.map((hit) => {
    const src = hit._source as {
      chunkId: string;
      title: string;
      source: string;
      content: string;
    };
    return {
      chunkId: src.chunkId,
      title: src.title,
      source: src.source,
      snippet: src.content.slice(0, 400),
      score: hit._score ?? 0,
    };
  });
}
