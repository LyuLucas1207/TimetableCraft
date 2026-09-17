import { toPng } from "html-to-image";

/** Print only the current timetable; the browser also offers Save as PDF. */
export async function printSchedule(node: HTMLElement, title: string): Promise<void> {
  const data = await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", filter: (element) => !(element instanceof HTMLElement && element.hasAttribute("data-export-hide")) });
  const frame = document.createElement("iframe");
  frame.title = title;
  frame.style.cssText = "position:fixed;width:1px;height:1px;left:-9999px;";
  document.body.append(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) { frame.remove(); throw new Error("errorExport"); }
  doc.title = title;
  const style = doc.createElement("style");
  style.textContent = "@page{size:landscape;margin:10mm}body{margin:0}img{display:block;max-width:100%;max-height:185mm;margin:auto;object-fit:contain}";
  doc.head.append(style);
  const image = doc.createElement("img");
  image.alt = title;
  doc.body.append(image);
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => { frame.remove(); reject(new Error("errorExport")); }; image.src = data; });
  win.addEventListener("afterprint", () => frame.remove(), { once: true });
  win.focus();
  win.print();
  // Some browsers do not dispatch afterprint for iframes.
  window.setTimeout(() => frame.remove(), 60_000);
}
