import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";
import { Client } from "@elastic/elasticsearch";
import { KB_INDEX } from "@emed/es";

const KNOWLEDGE_BASE_DIR = path.resolve("knowledge-base");
const CHUNK_SIZE = 800; // characters per chunk
const CHUNK_OVERLAP = 100;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const es = new Client({
  node: process.env.ELASTICSEARCH_URL ?? "http://localhost:9200",
  // Only if using Elastic Cloud
  ...(process.env.ELASTICSEARCH_API_KEY ? { auth: { apiKey: process.env.ELASTICSEARCH_API_KEY } } : {}),
});

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 50);
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(".txt", "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function ensureIndex() {
  const exists = await es.indices.exists({ index: KB_INDEX });
  if (!exists) {
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
}

async function ingest() {
  await ensureIndex();

  const files = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter((f) => f.endsWith(".txt"));
  console.log(`Found ${files.length} documents to ingest`);

  for (const file of files) {
    const source = file;
    const title = titleFromFilename(file);
    const text = fs.readFileSync(path.join(KNOWLEDGE_BASE_DIR, file), "utf-8");
    const chunks = chunkText(text);

    console.log(`\n[${title}] — ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const chunkId = crypto.createHash("sha256").update(`${source}:${i}`).digest("hex").slice(0, 16);

      const embResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });

      const embedding = embResponse.data[0].embedding;

      await es.index({
        index: KB_INDEX,
        id: chunkId,
        document: { chunkId, title, source, content, embedding },
      });

      process.stdout.write(".");
    }
  }

  console.log("\n\nIngestion complete.");
}

ingest().catch((err) => {
  console.error(err);
  process.exit(1);
});
