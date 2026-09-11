import { toPng } from "html-to-image";

export async function exportNodeToPng(node: HTMLElement, filename: string): Promise<void> {
  const hidden = Array.from(node.querySelectorAll<HTMLElement>("[data-export-hide]"));
  const previousDisplay = hidden.map((el) => el.style.display);
  for (const el of hidden) {
    el.style.display = "none";
  }

  try {
    const width = Math.ceil(node.scrollWidth);
    const height = Math.ceil(node.scrollHeight);
    const computedBg = getComputedStyle(node).backgroundColor;
    const backgroundColor =
      computedBg && computedBg !== "rgba(0, 0, 0, 0)" && computedBg !== "transparent"
        ? computedBg
        : node.style.background || node.style.backgroundColor || "#ffffff";

    const dataUrl = await toPng(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor,
      width,
      height,
      filter: (domNode) => !(domNode instanceof HTMLElement && domNode.hasAttribute("data-export-hide")),
      style: {
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: "none",
        maxHeight: "none",
        overflow: "hidden",
        overflowX: "hidden",
        overflowY: "hidden",
      },
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    hidden.forEach((el, index) => {
      el.style.display = previousDisplay[index] ?? "";
    });
  }
}
