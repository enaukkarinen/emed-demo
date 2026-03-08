import { Client } from "@elastic/elasticsearch";

export function getEsClient(): Client {
  const node = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
  const apiKey = process.env.ELASTICSEARCH_API_KEY;
  return new Client(apiKey ? { node, auth: { apiKey } } : { node });
}
