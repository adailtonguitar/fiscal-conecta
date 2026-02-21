import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register PWA service worker for offline support
import { registerSW } from "virtual:pwa-register";
registerSW({
  onRegistered(r) {
    // Check for updates every 30 minutes
    if (r) setInterval(() => r.update(), 30 * 60 * 1000);
  },
  onOfflineReady() {
    console.log("[PWA] App ready for offline use");
  },
});

// Global safety net: prevent unhandled promise rejections from crashing the app (white screen)
window.addEventListener("unhandledrejection", (event) => {
  console.warn("[Global] Unhandled promise rejection caught:", event.reason);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
