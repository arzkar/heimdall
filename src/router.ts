/* ============================================================
   Hash-Based View Router
   ============================================================ */

import type { ViewId } from "@/types";
import { DEFAULT_VIEW, VIEW_IDS } from "@/config/views";

type RouteChangeCallback = (view: ViewId) => void;

class Router {
  private listeners: RouteChangeCallback[] = [];

  constructor() {
    window.addEventListener("hashchange", () => this.notify());
  }

  get currentView(): ViewId {
    const hash = window.location.hash.replace("#/", "").replace("#", "");
    if (VIEW_IDS.includes(hash as ViewId)) return hash as ViewId;
    return DEFAULT_VIEW;
  }

  navigate(view: ViewId): void {
    window.location.hash = `#/${view}`;
  }

  onChange(cb: RouteChangeCallback): void {
    this.listeners.push(cb);
  }

  private notify(): void {
    const view = this.currentView;
    for (const cb of this.listeners) cb(view);
  }
}

export const router = new Router();
