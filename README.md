# eMed Assistant

A RAG-based chat assistant for the eMed weight management programme. Ask questions about GLP-1 medications, eligibility, side effects, and the programme in natural language — answers are grounded in a curated knowledge base rather than relying on the model's general knowledge.

## Architecture

```
apps/web          → Next.js 15 frontend (App Router) + streaming API route
packages/kb       → Knowledge base search module (Elasticsearch + OpenAI embeddings)
knowledge-base/   → Source documents (.txt) ingested into Elasticsearch
```

### How it works

1. **Ingestion** — 20 documents covering the eMed programme are chunked, embedded using OpenAI `text-embedding-3-small`, and indexed into Elasticsearch with a `dense_vector` mapping.

2. **Search** — when a user sends a message, `kbSearch()` embeds the query and runs a kNN search against the Elasticsearch index, returning the top 5 most semantically relevant chunks.

3. **Generation** — the retrieved chunks are injected into a system prompt as context. OpenAI `gpt-4o-mini` generates a response grounded in that context, streamed back to the client token by token.

```
User message
    ↓
kbSearch() → Elasticsearch kNN (cosine similarity)
    ↓
Top 5 chunks injected into system prompt
    ↓
OpenAI streaming completion
    ↓
ReadableStream → browser (token by token)
```

## Stack

- **Next.js 15** (App Router) — frontend and API route
- **Elasticsearch 8** — vector store with kNN search
- **OpenAI** — embeddings (`text-embedding-3-small`) and chat (`gpt-4o-mini`)
- **MUI** — component library
- **pnpm workspaces** — monorepo

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for Elasticsearch)
- OpenAI API key

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-...
ELASTICSEARCH_URL=http://localhost:9200
```

### 3. Start Elasticsearch

```bash
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

### 4. Ingest the knowledge base

```bash
pnpm kb:ingest
```

This reads all `.txt` files from `knowledge-base/`, chunks them into ~800 character segments, generates embeddings, and indexes them into Elasticsearch. Takes around 1–2 minutes depending on API latency.

You can verify search is working with:

```bash
pnpm kb:test "What are the side effects of Mounjaro?"
```

### 5. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
