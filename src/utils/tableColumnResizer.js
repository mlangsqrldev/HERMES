/**
 * Global column resizer for all HTML tables in HERMES.
 * Automatically attaches a subtle draggable resize handle to every
 * `thead th:not(:last-child)` across the application (including dynamically
 * mounted tables inside tabs, drawers, and modals).
 */

const HANDLE_CLASS = "hermes-col-resize-handle";

const enhanceTable = (table) => {
  if (!table || table.dataset?.colResizeCustom === "true") return;
  const headerRows = table.querySelectorAll(":scope > thead > tr");
  headerRows.forEach((tr) => {
    const ths = Array.from(tr.children).filter(
      (el) => el.tagName && el.tagName.toLowerCase() === "th",
    );
    ths.forEach((th, idx) => {
      if (idx === ths.length - 1) return; // no handle on last column
      if (th.querySelector(`:scope > .${HANDLE_CLASS}`)) return;

      const computedPos = window.getComputedStyle(th).position;
      if (computedPos === "static") {
        th.style.position = "relative";
      }

      const handle = document.createElement("span");
      handle.className = HANDLE_CLASS;
      handle.title = "Spaltenbreite ziehen / Drag to resize column";
      Object.assign(handle.style, {
        position: "absolute",
        right: "0",
        top: "4px",
        bottom: "4px",
        width: "6px",
        cursor: "col-resize",
        userSelect: "none",
        borderRadius: "3px",
        zIndex: "5",
      });

      handle.addEventListener("mouseenter", () => {
        handle.style.backgroundColor = "rgba(59, 130, 246, 0.35)";
      });
      handle.addEventListener("mouseleave", () => {
        if (!handle.dataset.dragging) {
          handle.style.backgroundColor = "transparent";
        }
      });

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handle.dataset.dragging = "1";
        handle.style.backgroundColor = "rgba(59, 130, 246, 0.55)";

        const startX = e.clientX;
        const startWidth = th.getBoundingClientRect().width;
        const minWidth = 48;

        // Lock current column widths once before resizing so sibling columns stay stable
        if (table.style.tableLayout !== "fixed") {
          ths.forEach((cell) => {
            if (!cell.style.width) {
              const w = Math.round(cell.getBoundingClientRect().width);
              if (w > 0) cell.style.width = `${w}px`;
            }
          });
          table.style.tableLayout = "fixed";
        }

        const onMouseMove = (moveEvent) => {
          const nextWidth = Math.max(
            minWidth,
            Math.round(startWidth + (moveEvent.clientX - startX)),
          );
          th.style.width = `${nextWidth}px`;
          th.style.minWidth = `${nextWidth}px`;
        };

        const onMouseUp = () => {
          delete handle.dataset.dragging;
          handle.style.backgroundColor = "transparent";
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });

      th.appendChild(handle);
    });
  });
};

const scanTables = (root = document) => {
  if (!root || typeof root.querySelectorAll !== "function") return;
  root.querySelectorAll("table").forEach(enhanceTable);
};

export function installTableColumnResizer() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__hermesTableResizerInstalled) return;
  window.__hermesTableResizerInstalled = true;

  const scheduleScan = () => {
    window.requestAnimationFrame(() => scanTables(document));
  };

  scheduleScan();

  const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        hasAddedNodes = true;
        break;
      }
    }
    if (hasAddedNodes) scheduleScan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
