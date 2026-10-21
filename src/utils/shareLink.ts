import type { PlannerId } from "@/config/planners";
import type { PlannerDocument } from "@/stores/planners";
import { FILE_KIND, sanitizeDocument, type ParsedPlan } from "./planIO";

export const SHARE_PARAM = "plan";
/** Browsers and chat apps start dropping very long URLs; beyond this, use a JSON file instead. */
export const SHARE_LIMIT = 12_000;

const toBase64Url = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const fromBase64Url = (text: string) => Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as BufferSource).then(() => writer.close());
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

/** Shared copies carry the plan, not personal history: undo stacks never leave the browser. */
export async function encodeShare(planner: PlannerId, document: PlannerDocument): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ kind: FILE_KIND, planner, document }));
  if (typeof CompressionStream === "undefined") return `j.${toBase64Url(json)}`;
  return `z.${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
}

/** Throws a localization key for unreadable links or ones meant for a different tool. */
export async function decodeShare(payload: string, planner: PlannerId): Promise<ParsedPlan> {
  try {
    const [mode, body] = [payload.slice(0, 2), payload.slice(2)];
    const bytes = fromBase64Url(body);
    const json = mode === "z." ? await pipe(bytes, new DecompressionStream("deflate-raw")) : mode === "j." ? bytes : null;
    if (!json) throw new Error("errorShareFormat");
    const raw = JSON.parse(new TextDecoder().decode(json)) as { kind?: string; planner?: string; document?: Record<string, unknown> };
    if (raw.kind !== FILE_KIND || !raw.document || !Array.isArray(raw.document.events)) throw new Error("errorShareFormat");
    if (raw.planner !== planner) throw new Error("errorSharePlanner");
    return sanitizeDocument(raw.document);
  } catch (error) {
    throw new Error(error instanceof Error && error.message.startsWith("errorShare") ? error.message : "errorShareFormat");
  }
}

export function shareUrl(payload: string): string {
  return `${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${payload}`;
}

export function sharePayloadFromHash(hash: string): string | null {
  const match = hash.match(new RegExp(`^#${SHARE_PARAM}=([A-Za-z0-9_.-]+)$`));
  return match ? match[1] : null;
}
