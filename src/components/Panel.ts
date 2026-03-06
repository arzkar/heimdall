/* ============================================================
   Panel Base Class
   ============================================================ */

import type { PanelOptions } from "@/types";
import { h, replaceChildren } from "@/utils/dom";

export class Panel {
  protected element: HTMLElement;
  protected content: HTMLElement;
  protected header: HTMLElement;
  protected countEl: HTMLElement | null = null;
  protected statusBadgeEl: HTMLElement | null = null;
  protected panelId: string;

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

    // Header right controls
    const headerRight = h("div", { className: "panel-header-right" });

    // Status badge
    this.statusBadgeEl = h("span", { className: "panel-data-badge" });
    this.statusBadgeEl.style.display = "none";
    headerRight.appendChild(this.statusBadgeEl);

    // Count badge
    if (options.showCount) {
      this.countEl = h("span", { className: "panel-count" }, "0");
      headerRight.appendChild(this.countEl);
    }

    // Close button
    const closeBtn = h(
      "button",
      { className: "panel-btn-close", title: "Close panel" },
      "✕",
    );
    closeBtn.onclick = () => this.hide();
    headerRight.appendChild(closeBtn);

    this.header.appendChild(headerRight);

    // Content area
    this.content = h("div", { className: "panel-content" });
    this.content.id = `${options.id}Content`;

    this.element.appendChild(this.header);
    this.element.appendChild(this.content);

    // Make draggable
    this.setupDrag();

    this.showLoading();
  }

  private setupDrag(): void {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      this.element.style.left = `${e.clientX - offsetX}px`;
      this.element.style.top = `${e.clientY - offsetY}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    this.header.addEventListener("mousedown", (e) => {
      if ((e.target as HTMLElement).closest("button")) return; // Don't drag if clicking buttons
      isDragging = true;
      const rect = this.element.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      // Bring to front
      this.element.style.zIndex = "1001";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public show(): void {
    this.element.classList.remove("hidden");
    this.element.style.zIndex = "1001"; // Bring to front when shown
  }

  public hide(): void {
    this.element.classList.add("hidden");
    this.element.style.zIndex = "500"; // Reset z-index
  }

  public toggle(): void {
    if (this.element.classList.contains("hidden")) {
      this.show();
    } else {
      this.hide();
    }
  }

  public isVisible(): boolean {
    return !this.element.classList.contains("hidden");
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
