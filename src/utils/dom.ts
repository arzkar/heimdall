/* ============================================================
   DOM Utilities — lightweight JSX-like helpers
   ============================================================ */

type Props = Record<string, unknown>;

/**
 * Create an HTML element with props and children.
 * ```
 * h('div', { className: 'foo' }, h('span', {}, 'Hello'))
 * ```
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === "className" && typeof value === "string") {
        el.className = value;
      } else if (
        key === "style" &&
        typeof value === "object" &&
        value !== null
      ) {
        Object.assign(el.style, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value as EventListener);
      } else if (
        key === "dataset" &&
        typeof value === "object" &&
        value !== null
      ) {
        Object.assign(el.dataset, value);
      } else if (typeof value === "string") {
        el.setAttribute(key, value);
      } else if (typeof value === "boolean" && value) {
        el.setAttribute(key, "");
      }
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Replace all children of a parent element.
 */
export function replaceChildren(
  parent: HTMLElement,
  ...nodes: (Node | string)[]
): void {
  parent.textContent = "";
  for (const node of nodes) {
    if (typeof node === "string") {
      parent.appendChild(document.createTextNode(node));
    } else {
      parent.appendChild(node);
    }
  }
}

/**
 * Format a relative time string (e.g., "3m ago", "2h ago").
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Generate a simple hash for deduplication.
 */
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}
