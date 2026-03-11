"use client";

import { Box } from "@mui/system";
import { Chat } from "./components/Chat/Chat";

import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import dynamic from "next/dynamic";
import { DRAWER_WIDTH } from "./constants/drawer";

const LeadsDrawer = dynamic(() => import("./components/LeadsDrawer").then((mod) => ({ default: mod.LeadsDrawer })), {
  ssr: false,
});

export default function Page() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box
        sx={{
          flex: 1,
          marginRight: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: "margin 0.3s ease",
        }}
      >
        <ErrorBoundary>
          <Chat />
        </ErrorBoundary>
      </Box>
      <LeadsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </Box>
  );
}
