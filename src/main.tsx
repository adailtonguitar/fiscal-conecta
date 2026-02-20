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

createRoot(document.getElementById("root")!).render(<App />);
