import { Box } from "@mui/system";
import { Chat } from "./components/Chat";
import { LeadsDrawer } from "./components/LeadsDrawer";

export default function Page() {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box sx={{ flex: 1, borderRight: "1px solid #ccc" }}>
        <Chat />
      </Box>
      <LeadsDrawer />
    </Box>
  );
}
