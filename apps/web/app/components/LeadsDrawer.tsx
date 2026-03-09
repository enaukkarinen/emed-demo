"use client";

import { useEffect, useState } from "react";
import { Lead } from "../types/lead";

import { Drawer, Typography } from "@mui/material";

export const LeadsDrawer = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/leads/stream");
    source.onopen = () => console.log("[LeadsDrawer] SSE connected");

    source.onmessage = (event) => {
      console.log("[LeadsDrawer] Received SSE message:", event.data);
      const lead: Lead = JSON.parse(event.data);
      setLeads((prev) => [lead, ...prev]);
      setIsOpen(true);
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
    <Drawer
      open={isOpen}
      onClose={() => setIsOpen(false)}
      anchor="right"
      variant="persistent"
      slotProps={{
        paper: { style: { width: "400px", padding: "16px" } },
      }}
    >
      <Typography variant="h5" sx={{ textAlign: "right" }}>
        Leads
      </Typography>
      {leads.length === 0 ? (
        <p>No leads found.</p>
      ) : (
        <ul>
          {leads.map((lead) => (
            <li key={lead.id}>
              <h2>{lead.name}</h2>
              <p>{lead.email}</p>
              <p>{lead.summary}</p>
              <p>Created At: {new Date(lead.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
};
