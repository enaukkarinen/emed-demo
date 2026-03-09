"use client";

import { useEffect, useState } from "react";
import { Lead } from "../types/lead";

import { Drawer, Typography } from "@mui/material";
import { textAlign } from "@mui/system";

export const LeadsDrawer = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const response = await fetch("/api/chat/leads");
      const data = (await response.json()) as Lead[];
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads data:", error);
    }
  }

  return (
    <Drawer
      open={true}
      onClose={() => {}}
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
