import { ColorPreset } from "@/types/course";

export interface PaletteColor {
  id: string;
  bg: string;
  border: string;
  text: string;
}

export const COLOR_PRESETS: Record<ColorPreset, PaletteColor[]> = {
  [ColorPreset.Pastel]: [
    { id: "blue", bg: "#DBEAFE", border: "#93C5FD", text: "#1E3A8A" },
    { id: "green", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
    { id: "yellow", bg: "#FEF3C7", border: "#FCD34D", text: "#78350F" },
    { id: "purple", bg: "#EDE9FE", border: "#C4B5FD", text: "#5B21B6" },
    { id: "pink", bg: "#FCE7F3", border: "#F9A8D4", text: "#9D174D" },
    { id: "cyan", bg: "#CFFAFE", border: "#67E8F9", text: "#155E75" },
    { id: "orange", bg: "#FFEDD5", border: "#FDBA74", text: "#9A3412" },
  ],
  [ColorPreset.Ubc]: [
    { id: "navy", bg: "#D7E3F4", border: "#7C9BC4", text: "#002145" },
    { id: "gold", bg: "#F8E7B0", border: "#E8C547", text: "#5C4813" },
    { id: "sky", bg: "#D6EEF8", border: "#7EB6D0", text: "#0B4F6C" },
    { id: "stone", bg: "#E7E5E4", border: "#A8A29E", text: "#44403C" },
    { id: "teal", bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
    { id: "rose", bg: "#FCE7F3", border: "#F9A8D4", text: "#9F1239" },
    { id: "slate", bg: "#E2E8F0", border: "#94A3B8", text: "#0F172A" },
  ],
  [ColorPreset.Ocean]: [
    { id: "deep", bg: "#CFFAFE", border: "#67E8F9", text: "#164E63" },
    { id: "wave", bg: "#BFDBFE", border: "#60A5FA", text: "#1E3A8A" },
    { id: "foam", bg: "#CCFBF1", border: "#5EEAD4", text: "#115E59" },
    { id: "navy", bg: "#DBEAFE", border: "#93C5FD", text: "#1E3A8A" },
    { id: "mint", bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
    { id: "ice", bg: "#E0F2FE", border: "#7DD3FC", text: "#0C4A6E" },
    { id: "kelp", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
  ],
  [ColorPreset.Sunset]: [
    { id: "peach", bg: "#FFEDD5", border: "#FDBA74", text: "#9A3412" },
    { id: "coral", bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B" },
    { id: "gold", bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
    { id: "pink", bg: "#FCE7F3", border: "#F9A8D4", text: "#9D174D" },
    { id: "lilac", bg: "#EDE9FE", border: "#C4B5FD", text: "#5B21B6" },
    { id: "amber", bg: "#FEF9C3", border: "#FDE047", text: "#854D0E" },
    { id: "rose", bg: "#FFE4E6", border: "#FDA4AF", text: "#9F1239" },
  ],
  [ColorPreset.Forest]: [
    { id: "moss", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
    { id: "sage", bg: "#ECFCCB", border: "#BEF264", text: "#3F6212" },
    { id: "pine", bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
    { id: "bark", bg: "#F5E6D3", border: "#D6B48A", text: "#7C2D12" },
    { id: "fern", bg: "#BBF7D0", border: "#4ADE80", text: "#166534" },
    { id: "mist", bg: "#E2E8F0", border: "#94A3B8", text: "#334155" },
    { id: "olive", bg: "#E7E5C8", border: "#C4B87A", text: "#3F3F16" },
  ],
  [ColorPreset.Mono]: [
    { id: "gray1", bg: "#F4F4F5", border: "#D4D4D8", text: "#18181B" },
    { id: "gray2", bg: "#E4E4E7", border: "#A1A1AA", text: "#18181B" },
    { id: "gray3", bg: "#D4D4D8", border: "#71717A", text: "#18181B" },
    { id: "gray4", bg: "#F8FAFC", border: "#CBD5E1", text: "#0F172A" },
    { id: "gray5", bg: "#EEF2FF", border: "#C7D2FE", text: "#1E1B4B" },
    { id: "gray6", bg: "#F1F5F9", border: "#94A3B8", text: "#0F172A" },
    { id: "gray7", bg: "#E5E7EB", border: "#9CA3AF", text: "#111827" },
  ],
};

export function resolvePaletteColor(bg: string, preset: ColorPreset = ColorPreset.Pastel): PaletteColor {
  const all = Object.values(COLOR_PRESETS).flat();
  const match = all.find((color) => color.bg.toLowerCase() === bg.toLowerCase());
  if (match) return match;
  return {
    id: "custom",
    bg,
    border: bg,
    text: preset === ColorPreset.Mono ? "#18181B" : "#1E293B",
  };
}

export function pickRandomPaletteColor(preset: ColorPreset, used: string[] = []): string {
  const palette = COLOR_PRESETS[preset];
  const unused = palette.filter((color) => !used.includes(color.bg));
  const pool = unused.length > 0 ? unused : palette;
  return pool[Math.floor(Math.random() * pool.length)].bg;
}

export function colorsForPreset(preset: ColorPreset): string[] {
  return COLOR_PRESETS[preset].map((color) => color.bg);
}
