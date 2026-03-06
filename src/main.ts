/* ============================================================
   Heimdall — Entry Point
   ============================================================ */

import { createApp } from "@/app";
import { inject } from "@vercel/analytics";

// Initialize Vercel Analytics
inject();

// Boot when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => createApp());
} else {
  createApp();
}
