# eMed Assistant

[![Gitleaks Secret Scan](https://github.com/enaukkarinen/emed-demo/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/enaukkarinen/emed-demo/actions/workflows/gitleaks.yml)

A chat assistant for the eMed weight management programme. Ask questions about GLP-1 medications, eligibility, side effects, and the programme in natural language — answers are grounded in a curated knowledge base. Users can register their interest and have their details saved via a conversational lead capture flow.

## Architecture

```
apps/web          → Next.js 15 frontend (App Router) + API routes
apps/mcp          → MCP server (Express + StreamableHTTPServerTransport)
packages/kb       → Knowledge base search (Elasticsearch kNN + OpenAI embeddings)
packages/es       → Elasticsearch index definitions (single source of truth)
knowledge-base/   → Source documents (.txt) ingested into Elasticsearch
```

### How it works

#### RAG Chat

1. **Ingestion** — 20 documents covering the eMed programme are chunked (~800 chars, 100 overlap), embedded using OpenAI `text-embedding-3-small`, and indexed into Elasticsearch with a `dense_vector` mapping.
2. **Search** — when a clinical or programme-related question is asked, the model calls the `search_knowledge_base` tool, which embeds the query and runs a kNN search against Elasticsearch (cosine similarity), returning the top 5 most relevant chunks.
3. **Generation** — the model uses the retrieved chunks to compose a grounded response. Simple greetings and small talk are answered directly without a KB lookup.

```
User message
    ↓
OpenAI tool-calling loop (runChat)
    ↓ (if clinical/programme question)
search_knowledge_base tool → Elasticsearch kNN (cosine similarity)
    ↓
Top 5 chunks returned to model
    ↓
Response returned to client
```

#### Lead Capture

When a user expresses interest in signing up, the assistant collects their name and email conversationally, then calls the `save_lead` MCP tool which indexes the lead (name, email, conversation summary, timestamp) into a separate `emed-leads` Elasticsearch index.

```
User: "I want to sign up"
    ↓
Assistant collects name → email
    ↓
save_lead tool call → MCP server → Elasticsearch (emed-leads index)
    ↓
Confirmation to user
```

#### Tool-calling loop

The API route uses OpenAI Chat Completions with tools. If the model requests a tool call, the server executes it via the MCP client and feeds the result back before generating the final response. A `MAX_TOOL_STEPS` cap prevents runaway loops.

```
app/api/chat/
  route.ts                  → validates request, calls runChat, returns response
  run-chat.ts               → tool-calling loop
  build-system-prompt.ts    → system prompt with tool usage instructions
  mcp/
    get-mcp-client.ts       → MCP singleton client
  openai-tools/
    tool-registry.ts        → search_knowledge_base + save_lead tool definitions + invoke
```

## Stack

- **Next.js 15** (App Router) — frontend and API routes
- **Express** — MCP server HTTP transport
- **Elasticsearch 8** — vector store (kNN search) + lead storage
- **OpenAI** — embeddings (`text-embedding-3-small`) and chat (`gpt-4o-mini`)
- **MUI** — component library
- **MCP SDK** — `McpServer` + `StreamableHTTPServerTransport` (stateless, fresh instance per request)
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
cp apps/mcp/env/mcp.env.example apps/mcp/env/mcp.env
```

Edit `.env` and add your keys:

```
OPENAI_API_KEY=sk-...
ELASTICSEARCH_URL=http://localhost:9200
```

### 3. Start Elasticsearch

```bash
pnpm db:build
```

This runs `docker compose -f docker/docker-compose.yml up -d` and starts Elasticsearch on port 9200 with a persistent volume.

### 4. Ingest the knowledge base

```bash
pnpm kb:ingest
```

Chunks all `.txt` files in `knowledge-base/`, generates embeddings, and indexes them into Elasticsearch. Takes 1–2 minutes. Verify with:

```bash
pnpm kb:test "What are the side effects of Mounjaro?"
```

### 5. Start the MCP server

In a separate terminal:

```bash
cd apps/mcp && pnpm dev
```

MCP server runs on `http://localhost:3333/mcp`.

### 6. Start the web app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Elasticsearch indices

| Index | Purpose |
|---|---|
| `emed-kb` | Knowledge base chunks with embeddings |
| `emed-leads` | Captured leads (name, email, summary, timestamp) |

Index mappings are defined in `packages/es/src/indices/` — single source of truth for all index schemas.
