"use client";

import { useEffect, useState } from "react";
import { Lead } from "../types/lead";

import { Box, Chip, Drawer, Fab, IconButton, Tooltip, Typography } from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { LeadsList } from "./LeadsList";
import { DRAWER_WIDTH } from "../constants/drawer";

type LeadsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const LeadsDrawer = ({ open, onOpenChange }: LeadsDrawerProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [connected, setConnected] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, []);

  // SSE setup
  useEffect(() => {
    const source = new EventSource("/api/leads/stream");
    source.onopen = () => {
      console.log("[LeadsDrawer] SSE connected");
      setConnected(true);
    };

    source.onmessage = (event) => {
      console.log("[LeadsDrawer] Received SSE message:", event.data);
      const lead: Lead = JSON.parse(event.data);
      setLeads((prev) => [lead, ...prev]);
      onOpenChange(true);
    };

    source.onerror = (err) => {
      console.error("[LeadsDrawer] SSE error:", err);
      source.close();
    };

    return () => {
      console.log("[LeadsDrawer] SSE connection closed");
      source.close();
    };
  }, []);

  async function fetchLeads() {
    try {
      const response = await fetch("/api/leads");
      const data = (await response.json()) as Lead[];
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads data:", error);
    }
  }

  return (
    <>
      <Tooltip title="View leads" placement="left">
        <Fab
          color="primary"
          onClick={() => onOpenChange(true)}
          sx={{ position: "fixed", top: 24, right: 24 }}
          size="medium"
        >
          <PeopleAltIcon />
        </Fab>
      </Tooltip>

      <Drawer
        open={open}
        onClose={() => onOpenChange(false)}
        anchor="right"
        variant="persistent"
        slotProps={{
          paper: {
            style: { width: DRAWER_WIDTH, display: "flex", flexFlow: "column", padding: "1rem", maxHeight: "100vh" },
          },
        }}
      >
        {/* Drawer header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Leads
            </Typography>
            <Chip label={leads.length} size="small" color="primary" />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={connected ? "Live" : "Disconnected"}>
              <FiberManualRecordIcon sx={{ fontSize: 12, color: connected ? "success.main" : "error.main" }} />
            </Tooltip>
            <IconButton onClick={() => onOpenChange(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Lead list */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <LeadsList leads={leads} />
        </Box>
      </Drawer>
    </>
  );
};
