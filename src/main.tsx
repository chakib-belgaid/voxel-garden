import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = document.getElementById("root");

if (!root) throw new Error("Systems Garden root element was not found.");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // The game remains fully usable online when service-worker registration is unavailable.
    });
  });
}
