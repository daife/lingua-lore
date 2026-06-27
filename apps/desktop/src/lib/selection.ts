export interface SelectionSnapshot {
  text: string;
  x: number;
  y: number;
  context: string;
}

export function readSelectionSnapshot(container: HTMLElement | null): SelectionSnapshot | null {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? "";
  if (!selection || text.length < 2 || !container || !container.contains(selection.anchorNode)) {
    return null;
  }
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const rect = range?.getBoundingClientRect();
  if (!rect) {
    return null;
  }
  return {
    text: text.slice(0, 120),
    x: Math.min(rect.left + rect.width / 2, window.innerWidth - 360),
    y: rect.bottom + 10,
    context: container.textContent?.slice(0, 800) ?? ""
  };
}
