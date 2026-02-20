import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear old PWA cache with wrong name
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  });
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
}

// Global safety net: prevent unhandled promise rejections from crashing the app (white screen)
window.addEventListener("unhandledrejection", (event) => {
  console.warn("[Global] Unhandled promise rejection caught:", event.reason);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
