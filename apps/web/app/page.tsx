"use client";

import { Box } from "@mui/system";
import { Chat } from "./components/Chat";
import { LeadsDrawer, DRAWER_WIDTH } from "./components/LeadsDrawer";
import { useState } from "react";

export default function Page() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", height: "100vh"  }}>
      <Box
        sx={{
          flex: 1,
          marginRight: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: "margin 0.3s ease",
        }}
      >
        <Chat />
      </Box>
      <LeadsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </Box>
  );
}
