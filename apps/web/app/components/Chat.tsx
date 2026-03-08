"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { keyframes } from "@mui/system";

import { TypingIndicator } from "./TypingIndicator";
import { CookieBanner } from "./CookieBanner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [consented, setConsented] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
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
    } catch {
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
        padding: "4rem 2rem",
        boxSizing: "border-box",
        bgcolor: "background.default",
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 8rem)",
        }}
      >
        {/* Header */}
        <Box sx={{ padding: "1rem 2rem", borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h2">eMed Assistant</Typography>
          <Typography variant="caption">Ask anything about the weight management programme</Typography>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: "auto", py: 2, padding: "2rem" }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 8 }}>
              Ask a question to get started
            </Typography>
          )}
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            const showTyping = loading && isLast && msg.role === "assistant";
            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: "80%",
                    px: "14px",
                    py: "10px",
                    borderRadius: 2,
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    bgcolor: msg.role === "user" ? "primary.main" : "#525252",
                    color: msg.role === "user" ? "primary.contrastText" : "white",
                    border: msg.role === "assistant" ? "1px solid" : "none",
                    borderColor: "divider",
                    animation: `${fadeUp} 0.2s ease-out`,
                  }}
                >
                  {msg.content || (showTyping ? <TypingIndicator /> : "")}
                </Box>
              </Box>
            );
          })}
          <div ref={bottomRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            padding: "1rem",
          }}
        >
          <TextField
            sx={{ flex: 1 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about eligibility, medications, side effects..."
            disabled={loading || !consented}
            variant="standard"
            inputRef={inputRef}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !consented}
            variant="contained"
            color="primary"
          >
            Send
          </Button>
        </Box>
      </Card>
      <CookieBanner onConsent={() => setConsented(true)} />
    </Box>
  );
}
