import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)

// Show the window after the frontend has mounted and rendered content.
// This prevents the transparent-frame flash on Windows where DWM renders
// a native shadow before WebView2 finishes initialising.
// Follows Tauri's recommendation: visible=false in config → show() from frontend.
import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
  const win = getCurrentWindow()
  win.show().catch(() => {})
  win.setFocus().catch(() => {})
})
