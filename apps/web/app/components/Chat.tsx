"use client";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import { useState, useRef, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import theme from "../theme";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    const userMessage: Message = { role: "user", content: message };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Add an empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok || !response.body) throw new Error("Request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Read stream chunks and append to the last message
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100vh",
        padding: "4rem 2rem",
        background: "#f9fafb",
      }}
    >
      <Card
        sx={{
          minWidth: 275,
          maxWidth: 600,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ padding: 2 }}>
          <Typography variant="h2">eMed Assistant</Typography>
          <Typography variant="caption">Ask anything about the weight management programme</Typography>
        </Box>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
          {messages.length === 0 && (
            <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", marginTop: 60 }}>
              Ask a question to get started
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: 1,
                  fontSize: 14,
                  lineHeight: 1.6,
                  background: msg.role === "user" ? theme.palette.primary.main : theme.palette.background.default,
                  color: msg.role === "user" ? "#ffffff" : "#111827",
                  border: msg.role === "assistant" ? "1px solid #e5e7eb" : "none",
                  whiteSpace: "pre-wrap",
                  marginBottom: 0,
                  marginRight: msg.role === "user" ? 0 : 1,
                  marginLeft: msg.role === "user" ? 1 : 0,
                }}
              >
                {msg.content || (loading && i === messages.length - 1 ? "▋" : "")}
              </Box>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <Box sx={{ display: "flex", gap: 2, padding: "1rem 0 0" }}>
          <TextField
            sx={{ flex: 1 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about eligibility, medications, side effects..."
            disabled={loading}
            variant="standard"
          />

          <Button onClick={sendMessage} disabled={loading || !input.trim()} variant="contained" color="primary">
            Send
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
