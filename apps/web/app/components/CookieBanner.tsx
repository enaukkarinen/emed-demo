"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const CONSENT_KEY = "emed-gdpr-consent";

type Props = {
  onConsent: () => void;
};

export function CookieBanner({ onConsent }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
    else onConsent();
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
    onConsent();
  }

  function decline() {
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: "#1a1a1a",
        color: "white",
        px: { xs: 2, sm: 4 },
        py: 2.5,
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.2)",
      }}
    >
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Your privacy matters
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
          If you choose to register your interest, we will collect and store your name and email address to allow the
          eMed clinical team to contact you. This data is processed in accordance with UK GDPR. By continuing, you
          consent to this use of your personal data as described in our{" "}
          <Box
            component="a"
            href="https://www.emed.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#c47a8a", textDecoration: "underline", cursor: "pointer" }}
          >
            Privacy Policy
          </Box>
          .
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
        <Button
          onClick={decline}
          size="small"
          sx={{
            color: "rgba(255,255,255,0.6)",
            borderColor: "rgba(255,255,255,0.2)",
            "&:hover": { borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.05)" },
          }}
          variant="outlined"
        >
          Decline
        </Button>
        <Button
          onClick={accept}
          size="small"
          variant="contained"
          sx={{
            bgcolor: "#60243a",
            "&:hover": { bgcolor: "#7a2e4a" },
          }}
        >
          Accept
        </Button>
      </Box>
    </Box>
  );
}
