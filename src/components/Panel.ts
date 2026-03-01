/* ============================================================
   Panel Base Class
   ============================================================ */

import type { PanelOptions } from "@/types";
import { h, replaceChildren } from "@/utils/dom";

const PANEL_SPANS_KEY = "heimdall-panel-spans";

function loadPanelSpans(): Record<string, number> {
  try {
    const stored = localStorage.getItem(PANEL_SPANS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePanelSpan(panelId: string, span: number): void {
  const spans = loadPanelSpans();
  spans[panelId] = span;
  localStorage.setItem(PANEL_SPANS_KEY, JSON.stringify(spans));
}

function getRowSpan(el: HTMLElement): number {
  if (el.classList.contains("span-3")) return 3;
  if (el.classList.contains("span-2")) return 2;
  return 1;
}

function setSpanClass(el: HTMLElement, span: number): void {
  el.classList.remove("span-1", "span-2", "span-3");
  if (span > 1) el.classList.add(`span-${span}`);
}

const RESIZE_STEP = 80;

export class Panel {
  protected element: HTMLElement;
  protected content: HTMLElement;
  protected header: HTMLElement;
  protected countEl: HTMLElement | null = null;
  protected statusBadgeEl: HTMLElement | null = null;
  protected panelId: string;

  private resizeHandle: HTMLElement;
  private isResizing = false;
  private startY = 0;
  private startSpan = 1;

  constructor(options: PanelOptions) {
    this.panelId = options.id;

    // Root element
    this.element = h("div", {
      className: `panel ${options.className || ""}`,
      dataset: { panel: options.id },
    });

    // Header
    this.header = h("div", { className: "panel-header" });
    const headerLeft = h("div", { className: "panel-header-left" });
    headerLeft.appendChild(
      h("span", { className: "panel-title" }, options.title),
    );
    this.header.appendChild(headerLeft);

    // Status badge
    this.statusBadgeEl = h("span", { className: "panel-data-badge" });
    this.statusBadgeEl.style.display = "none";
    this.header.appendChild(this.statusBadgeEl);

    // Count badge
    if (options.showCount) {
      this.countEl = h("span", { className: "panel-count" }, "0");
      this.header.appendChild(this.countEl);
    }

    // Content area
    this.content = h("div", { className: "panel-content" });
    this.content.id = `${options.id}Content`;

    this.element.appendChild(this.header);
    this.element.appendChild(this.content);

    // Resize handle
    this.resizeHandle = h("div", { className: "panel-resize-handle" });
    this.element.appendChild(this.resizeHandle);
    this.setupResize();

    // Restore saved span
    const savedSpans = loadPanelSpans();
    const saved = savedSpans[this.panelId];
    if (saved && saved > 1) setSpanClass(this.element, saved);

    this.showLoading();
  }

  private setupResize(): void {
    const onMouseMove = (e: MouseEvent) => {
      if (!this.isResizing) return;
      const delta = e.clientY - this.startY;
      const spanDelta =
        delta > 0
          ? Math.floor(delta / RESIZE_STEP)
          : Math.ceil(delta / RESIZE_STEP);
      const newSpan = Math.max(1, Math.min(3, this.startSpan + spanDelta));
      setSpanClass(this.element, newSpan);
    };

    const onMouseUp = () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.classList.remove("panel-resize-active");
      savePanelSpan(this.panelId, getRowSpan(this.element));
    };

    this.resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isResizing = true;
      this.startY = e.clientY;
      this.startSpan = getRowSpan(this.element);
      document.body.classList.add("panel-resize-active");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    // Double-click to reset
    this.resizeHandle.addEventListener("dblclick", () => {
      setSpanClass(this.element, 1);
      const spans = loadPanelSpans();
      delete spans[this.panelId];
      localStorage.setItem(PANEL_SPANS_KEY, JSON.stringify(spans));
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public showLoading(message = "Loading…"): void {
    replaceChildren(
      this.content,
      h(
        "div",
        { className: "panel-loading" },
        h("div", { className: "panel-loading-spinner" }),
        h("div", { className: "panel-loading-text" }, message),
      ),
    );
  }

  public showError(message = "Failed to load"): void {
    replaceChildren(
      this.content,
      h("div", { className: "error-message" }, message),
    );
  }

  public setCount(count: number): void {
    if (!this.countEl) return;
    const prev = parseInt(this.countEl.textContent ?? "0", 10);
    this.countEl.textContent = count.toString();
    if (count > prev) {
      this.countEl.classList.remove("bump");
      void this.countEl.offsetWidth;
      this.countEl.classList.add("bump");
    }
  }

  protected setDataBadge(state: "live" | "cached" | "unavailable"): void {
    if (!this.statusBadgeEl) return;
    this.statusBadgeEl.textContent = state.toUpperCase();
    this.statusBadgeEl.className = `panel-data-badge ${state}`;
    this.statusBadgeEl.style.display = "inline-flex";
  }

  public setContent(html: string): void {
    this.content.innerHTML = html;
  }

  public setContentNodes(...nodes: (Node | string)[]): void {
    replaceChildren(this.content, ...nodes);
  }

  public destroy(): void {
    this.element.remove();
  }
}
