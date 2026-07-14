import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./recruiter/recruiter.css";

const root = document.getElementById("root");

if (!root) throw new Error("Portfolio root element was not found.");

const path = window.location.pathname.length > 1
  ? window.location.pathname.replace(/\/+$/, "")
  : window.location.pathname;

if (path === "/fr/garden") {
  window.location.replace("/garden");
} else if (path === "/garden") {
  document.documentElement.lang = "en";
  document.body.classList.add("garden-route");

  const { GardenApp } = await import("./garden/GardenApp");
  createRoot(root).render(
    <React.StrictMode>
      <a className="skip-link" href="#game-ui">Skip to game interface</a>
      <GardenApp />
    </React.StrictMode>
  );

  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/garden" }).catch(() => {
        // The game remains fully usable online when service-worker registration is unavailable.
      });
    });
  }
} else {
  const locale = path === "/fr" || path.startsWith("/fr/") ? "fr" : "en";
  document.documentElement.lang = locale;
  document.body.classList.add("recruiter-route");

  const { RecruiterRouter } = await import("./recruiter/RecruiterRouter");
  const app = (
    <React.StrictMode>
      <RecruiterRouter route={path} />
    </React.StrictMode>
  );

  if (root.hasChildNodes()) {
    hydrateRoot(root, app);
  } else {
    createRoot(root).render(app);
  }
}
