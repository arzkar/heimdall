/* ============================================================
   Heimdall — Entry Point
   ============================================================ */

import { createApp } from "@/app";

// Boot when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => createApp());
} else {
  createApp();
}
