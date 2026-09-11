import { toPng } from "html-to-image";

import { ExportAspect, EXPORT_ASPECT_RATIO, type TimetableSettings } from "@/types/course";

export function measureScreenSize(): { width: number; height: number; ratio: number } {
  const width = Math.max(1, Math.round(window.screen?.width || window.innerWidth || 1));
  const height = Math.max(1, Math.round(window.screen?.height || window.innerHeight || 1));
  return { width, height, ratio: width / height };
}

export function resolveExportAspectRatio(settings: TimetableSettings): number | null {
  if (settings.exportAspect !== ExportAspect.Screen) {
    return EXPORT_ASPECT_RATIO[settings.exportAspect];
  }
  if (settings.exportScreenWidth > 0 && settings.exportScreenHeight > 0) {
    return settings.exportScreenWidth / settings.exportScreenHeight;
  }
  if (typeof window === "undefined") return null;
  return measureScreenSize().ratio;
}

export async function exportNodeToPng(
  node: HTMLElement,
  filename: string,
  options?: { aspectRatio?: number | null },
): Promise<void> {
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

    let dataUrl = await toPng(node, {
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

    const aspectRatio = options?.aspectRatio;
    if (aspectRatio && aspectRatio > 0) {
      dataUrl = await padImageToAspect(dataUrl, aspectRatio, backgroundColor);
    }

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

function padImageToAspect(dataUrl: string, aspectRatio: number, backgroundColor: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const imgW = image.naturalWidth;
      const imgH = image.naturalHeight;
      if (!imgW || !imgH) {
        resolve(dataUrl);
        return;
      }
      const current = imgW / imgH;
      let canvasW = imgW;
      let canvasH = imgH;
      if (current > aspectRatio) {
        canvasH = Math.round(imgW / aspectRatio);
      } else {
        canvasW = Math.round(imgH * aspectRatio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(image, Math.round((canvasW - imgW) / 2), Math.round((canvasH - imgH) / 2));
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Could not compose export image"));
    image.src = dataUrl;
  });
}
