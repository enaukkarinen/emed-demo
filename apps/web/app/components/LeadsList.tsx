import { memo, useEffect, useRef } from "react";
import { Typography, Divider } from "@mui/material";
import { Box } from "@mui/system";

import { Lead } from "../types/lead";

const LeadItem = memo(({ lead }: { lead: Lead }) => {
  return (
    <>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {lead.name}
          </Typography>
          <Typography variant="body2" color="text.primary">
            {new Date(lead.createdAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
          {lead.email}
        </Typography>
        {lead.summary && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              fontSize: 12,
              color: "text.primary",
              lineHeight: 1.5,
            }}
          >
            {lead.summary}
          </Typography>
        )}
      </Box>
      <Divider sx={{ "&:last-child": { display: "none" } }} />
    </>
  );
});
export const LeadsList = ({ leads }: { leads: Lead[] }) => {
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [leads]);

  return (
    <Box ref={topRef}>
      {leads.length === 0 ? (
        <Typography variant="body2" color="text.primary" sx={{ textAlign: "center", mt: 8, px: 2 }}>
          No leads yet. They'll appear here in real time.
        </Typography>
      ) : (
        leads.map((lead, i) => <LeadItem key={lead.id ?? i} lead={lead} />)
      )}
    </Box>
  );
};
