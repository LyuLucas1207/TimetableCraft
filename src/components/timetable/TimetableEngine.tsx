import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";

import { ClockIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import { APP_NAME } from "@/constants";
import { type TimetableSettings } from "@/types/course";
import { type ScheduleEvent, type ScheduleColumn } from "@/types/schedule";
import { eventMatchesColumn } from "@/utils/schedule";
import { TITLE_PRESET_I18N_KEY, isDefaultPresetTitle } from "@/utils/appearance";
import { resolvePaletteColor } from "@/utils/colors";
import { layoutOverlaps } from "@/utils/overlaps";
import { buildTimeSlots, collapseIdleBounds, formatDisplayTime, formatTimeRange, snapDown, snapUp, timeToMinutes, minutesToTime } from "@/utils/time";

interface TimetableEngineProps {
  events: ScheduleEvent[];
  columns: ScheduleColumn[];
  summary?: ReactNode;
  emptyHint?: string;
  slotLabel?: (column: ScheduleColumn, time: string) => string;
  settings: TimetableSettings;
  onBlockClick?: (event: ScheduleEvent) => void;
  onSlotClick?: (column: ScheduleColumn, startTime: string) => void;
  exportRef?: Ref<HTMLDivElement>;
  interactive?: boolean;
  headerEdit?: ReactNode;
  onTitleCommit?: (title: string) => void;
  /** Planner tools only. Show times as 24-hour. */
  hour24?: boolean;
  /** Planner tools only. Rendered inside the exported area, below the grid. */
  legend?: ReactNode;
  /** Planner tools only. Enables dragging a block to another column or start time. */
  onBlockMove?: (event: ScheduleEvent, column: ScheduleColumn, startTime: string, from: ScheduleColumn) => void;
  /** Planner tools only. Enables dragging a block's bottom edge to change its end time. */
  onBlockResize?: (event: ScheduleEvent, endTime: string) => void;
}

interface DragState { id: string; dx: number; dy: number; mode: "move" | "resize" }
interface DragStart { event: ScheduleEvent; mode: "move" | "resize"; x: number; y: number; col: number; startMin: number; endMin: number; moved: boolean }

interface BlockEvent {
  id: string;
  item: ScheduleEvent;
  startMin: number;
  endMin: number;
}

const ROW_HEIGHT: Record<TimetableSettings["intervalMinutes"], number> = {
  15: 22,
  30: 36,
  60: 52,
  120: 68,
};

export default function TimetableEngine({
  events,
  columns,
  summary,
  emptyHint,
  slotLabel,
  settings,
  onBlockClick,
  onSlotClick,
  exportRef,
  interactive = true,
  headerEdit,
  onTitleCommit,
  hour24 = false,
  legend,
  onBlockMove,
  onBlockResize,
}: TimetableEngineProps) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const scheduled = events.filter((event) => event.date || event.days?.length || event.columnKey);
  const unscheduled = events.filter((event) => !event.date && !event.days?.length && !event.columnKey);
  const fmt = (value: string) => (hour24 ? value : formatDisplayTime(value));
  const fmtRange = (start: string, end: string) => (hour24 ? `${start} – ${end}` : formatTimeRange(start, end));
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<DragStart | null>(null);
  const justDragged = useRef(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const layout = useMemo(() => buildLayout(scheduled, settings, columns), [scheduled, settings, columns]);
  const gridCols = `88px repeat(${Math.max(1, columns.length)}, minmax(0, 1fr))`;

  if (scheduled.length === 0 && unscheduled.length === 0 && !interactive) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <ClockIcon size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">{t("emptyTitle", { ns: PAGE.App })}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("emptyBody", { ns: PAGE.App })}</p>
      </div>
    );
  }

  const rowHeight = ROW_HEIGHT[settings.intervalMinutes];
  const gridHeight = layout.slots.length * rowHeight;
  const titleLabel = isDefaultPresetTitle(settings.titlePreset, settings.title)
    ? t(TITLE_PRESET_I18N_KEY[settings.titlePreset], { ns: "language" })
    : settings.title || t("untitled", { ns: PAGE.App });

  return (
    <div
      ref={exportRef}
      className="overflow-visible rounded-2xl border shadow-sm"
      style={{ minWidth: columns.length === 1 ? 320 : Math.max(860, columns.length * 150 + 88), background: settings.pageBg, borderColor: settings.gridLine }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 overflow-visible rounded-t-2xl px-5 py-4 pr-6" style={{ background: settings.headerBg, color: settings.headerText }}>
        <div className="min-w-0 overflow-visible">
          {settings.showBrand ? (
            <p className="font-semibold tracking-wide uppercase" style={{ color: settings.kickerColor, fontSize: settings.kickerFontSize }}>
              {APP_NAME}
            </p>
          ) : null}
          <div className="flex min-w-0 items-center gap-1.5 overflow-visible">
            <TimetableTitle
              label={titleLabel}
              interactive={interactive}
              color={settings.headerText}
              fontSize={settings.titleFontSize}
              onCommit={onTitleCommit}
            />
            {interactive ? <ExportHide>{headerEdit}</ExportHide> : null}
          </div>
          {settings.subtitle ? (
            <p className="min-w-0 truncate" style={{ color: settings.kickerColor, fontSize: settings.subtitleFontSize }}>{settings.subtitle}</p>
          ) : null}
        </div>
        {summary ? (
          <p className="shrink-0 text-sm" style={{ color: settings.kickerColor }}>
            {summary}
          </p>
        ) : null}
      </div>
      <div className={settings.showFooter ? "overflow-hidden" : "overflow-hidden rounded-b-2xl"}>
        <div
          className="grid border-b text-xs font-semibold"
          style={{ gridTemplateColumns: gridCols, borderColor: settings.gridLine }}
        >
          <div className="border-r px-3 py-2" style={{ background: settings.timeBg, color: settings.timeText, borderColor: settings.gridLine }}>
            {t("common.time", { ns: LANG_NS })}
          </div>
          {columns.map((column, col) => (
            <div
              key={column.key}
              className={col === 0 ? "px-3 py-2" : "border-l px-3 py-2"}
              style={{ background: settings.dayHeaderBg, color: settings.dayHeaderText, borderColor: settings.gridLine, ...(column.color ? { boxShadow: `inset 0 3px 0 ${column.color}` } : {}) }}
            >
              {column.label}
            </div>
          ))}
        </div>
        {interactive && events.length === 0 ? (
          <ExportHide>
            <p className="border-b px-5 py-2 text-xs" style={{ color: settings.kickerColor, borderColor: settings.gridLine, background: settings.pageBg }}>
              {emptyHint ?? t("formSlotHint", { ns: PAGE.App })}
            </p>
          </ExportHide>
        ) : null}
        {unscheduled.length > 0 ? (
          <div className="border-b" style={{ borderColor: settings.gridLine, background: settings.pageBg }}>
            {unscheduled.map((item) => {
              const palette = resolvePaletteColor(item.color, settings.colorPreset);
              const label = item.title;
              return (
                <div key={item.id} className="grid" style={{ gridTemplateColumns: gridCols }}>
                  <div className="flex items-center border-r px-2 text-[11px]" style={{ background: settings.timeBg, color: settings.timeText, borderColor: settings.gridLine }}>
                    {t("unscheduledBar", { ns: PAGE.App })}
                  </div>
                  <div className="p-1" style={{ gridColumn: `span ${columns.length}` }}>
                    <button
                      type="button"
                      className={`flex min-h-9 w-full items-center gap-2 overflow-hidden px-2.5 py-1.5 text-left ${
                        interactive ? "transition-transform hover:-translate-y-px" : "pointer-events-none"
                      }`}
                      style={{
                        background: palette.bg,
                        border: `1.5px ${(item.borderStyle ?? "solid")} ${palette.border}`,
                        color: palette.text,
                        borderRadius: settings.cornerRadius,
                        opacity: item.muted ? 0.92 : 1,
                      }}
                      title={`${label}\n${item.subtitle}\n${t("unscheduledHint", { ns: PAGE.App })}`}
                      onClick={() => interactive && onBlockClick?.(item)}
                    >
                      <span className="shrink-0 font-bold" style={{ fontSize: settings.blockTitleFontSize }}>
                        {label}
                      </span>
                      {settings.showTitles && item.subtitle ? (
                        <span className="min-w-0 truncate opacity-90" style={{ fontSize: settings.blockMetaFontSize }}>
                          {item.subtitle}
                        </span>
                      ) : null}
                      <span className="ml-auto shrink-0 opacity-80" style={{ fontSize: settings.blockMetaFontSize }}>
                        {t("unscheduledHint", { ns: PAGE.App })}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="relative overflow-hidden" style={{ height: gridHeight, background: settings.pageBg }}>
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: gridCols,
              gridTemplateRows: `repeat(${layout.slots.length}, ${rowHeight}px)`,
            }}
          >
            {layout.slots.map((slot, row) => (
              <Fragment key={slot}>
                <div
                  className="box-border flex items-start overflow-hidden border-b border-r px-2 text-[11px] leading-none"
                  style={{
                    gridColumn: 1,
                    gridRow: row + 1,
                    background: settings.timeBg,
                    color: settings.timeText,
                    borderColor: settings.gridLine,
                    paddingTop: 4,
                  }}
                >
                  {fmt(slot)}
                </div>
                {columns.map((column, col) =>
                  interactive && onSlotClick ? (
                    <button
                      key={column.key}
                      type="button"
                      className={`box-border m-0 block size-full appearance-none rounded-none border-0 border-b bg-transparent p-0 transition-colors hover:bg-primary/20 focus-visible:bg-primary/20 focus-visible:outline-none ${col === 0 ? "" : "border-l"}`}
                      style={{
                        gridColumn: col + 2,
                        gridRow: row + 1,
                        borderColor: settings.gridLine,
                      }}
                      aria-label={slotLabel?.(column, slot) ?? t("formSlotCreate", { ns: PAGE.App, day: column.label, time: fmt(slot) })}
                      onClick={() => onSlotClick(column, slot)}
                    />
                  ) : (
                    <div
                      key={column.key}
                      className={`box-border size-full border-b ${col === 0 ? "" : "border-l"}`}
                      style={{
                        gridColumn: col + 2,
                        gridRow: row + 1,
                        borderColor: settings.gridLine,
                      }}
                    />
                  ),
                )}
              </Fragment>
            ))}
          </div>
          <div
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div />
            {columns.map((column, columnIndex) => (
              <div key={column.key} className="relative min-w-0">
                {layout.byColumn[column.key].map((item) => {
                  const top = ((item.event.startMin - layout.startMin) / settings.intervalMinutes) * rowHeight;
                  const dragging = drag?.id === item.event.id ? drag : null;
                  const height = ((item.event.endMin - item.event.startMin) / settings.intervalMinutes) * rowHeight + (dragging?.mode === "resize" ? dragging.dy : 0);
                  const width = 100 / item.columns;
                  const left = item.column * width;
                  const palette = resolvePaletteColor(item.event.item.color, settings.colorPreset);
                  const event = item.event.item;
                  const label = event.title;
                  const canMove = interactive && Boolean(onBlockMove) && !event.baseId;
                  const canResize = interactive && Boolean(onBlockResize) && !event.baseId;
                  const begin = (mode: "move" | "resize") => (pointer: ReactPointerEvent<HTMLElement>) => {
                    if (pointer.button !== 0 || pointer.pointerType === "touch") return;
                    if (mode === "resize") pointer.stopPropagation();
                    pointer.currentTarget.setPointerCapture(pointer.pointerId);
                    dragStart.current = { event, mode, x: pointer.clientX, y: pointer.clientY, col: columnIndex, startMin: item.event.startMin, endMin: item.event.endMin, moved: false };
                  };
                  const track = (pointer: ReactPointerEvent<HTMLElement>) => {
                    const start = dragStart.current;
                    if (!start || start.event.id !== event.id) return;
                    const dx = pointer.clientX - start.x;
                    const dy = pointer.clientY - start.y;
                    if (!start.moved && Math.hypot(dx, dy) < 5) return;
                    start.moved = true;
                    setDrag({ id: event.id, dx: start.mode === "move" ? dx : 0, dy, mode: start.mode });
                  };
                  const finish = (pointer: ReactPointerEvent<HTMLElement>) => {
                    const start = dragStart.current;
                    if (!start || start.event.id !== event.id) return;
                    dragStart.current = null;
                    setDrag(null);
                    if (!start.moved) return;
                    justDragged.current = true;
                    window.setTimeout(() => { justDragged.current = false; }, 0);
                    const steps = Math.round((pointer.clientY - start.y) / rowHeight);
                    if (start.mode === "resize") {
                      const end = Math.min(24 * 60, Math.max(start.startMin + settings.intervalMinutes, start.endMin + steps * settings.intervalMinutes));
                      if (end !== start.endMin) onBlockResize?.(event, minutesToTime(end));
                      return;
                    }
                    const width = ((overlayRef.current?.getBoundingClientRect().width ?? 0) - 88) / Math.max(1, columns.length);
                    const target = width > 0 ? Math.min(columns.length - 1, Math.max(0, start.col + Math.round((pointer.clientX - start.x) / width))) : start.col;
                    const length = start.endMin - start.startMin;
                    const begin = Math.min(layout.endMin - length, Math.max(layout.startMin, start.startMin + steps * settings.intervalMinutes));
                    if (target !== start.col || begin !== start.startMin) onBlockMove?.(event, columns[target], minutesToTime(Math.max(0, begin)), columns[start.col]);
                  };
                  return (
                    <button
                      key={item.event.id}
                      type="button"
                      className={`pointer-events-auto absolute box-border overflow-hidden px-1.5 py-1 text-left shadow-sm ${interactive ? (dragging ? "" : "transition-transform hover:-translate-y-px") : "pointer-events-none"} ${canMove ? "cursor-grab active:cursor-grabbing" : ""}`}
                      style={{
                        top: top + 2,
                        height: Math.max(height - 4, 24),
                        left: `calc(${left}% + 4px)`,
                        width: `calc(${width}% - 8px)`,
                        background: palette.bg,
                        border: `1.5px ${(event.borderStyle ?? "solid")} ${palette.border}`,
                        color: palette.text,
                        borderRadius: settings.cornerRadius,
                        opacity: dragging ? 0.8 : event.muted || event.done ? 0.92 : 1,
                        ...(dragging?.mode === "move" ? { transform: `translate(${dragging.dx}px, ${dragging.dy}px)`, zIndex: 30 } : {}),
                        ...(event.done ? { textDecoration: "line-through" } : {}),
                        ...(canMove ? { touchAction: "pan-y" } : {}),
                      }}
                      title={`${label}\n${event.subtitle ?? ""}\n${fmtRange(event.startTime, event.endTime)}\n${event.location ?? ""}`}
                      onClick={() => { if (justDragged.current) return; if (interactive) onBlockClick?.(event); }}
                      {...(canMove ? { onPointerDown: begin("move"), onPointerMove: track, onPointerUp: finish, onPointerCancel: () => { dragStart.current = null; setDrag(null); } } : {})}
                    >
                      <div className="truncate font-bold leading-tight" style={{ fontSize: settings.blockTitleFontSize }}>
                        {label}
                      </div>
                      {settings.showTitles && height > 40 ? (
                        <div className="truncate leading-tight opacity-90" style={{ fontSize: settings.blockMetaFontSize }}>
                          {event.subtitle}
                        </div>
                      ) : null}
                      {height > 54 ? (
                        <div className="truncate opacity-80" style={{ fontSize: settings.blockMetaFontSize }}>
                          {fmtRange(event.startTime, event.endTime)}
                        </div>
                      ) : null}
                      {settings.showRooms && height > 68 ? (
                        <div className="truncate opacity-80" style={{ fontSize: settings.blockMetaFontSize }}>
                          {event.location ?? ""}
                        </div>
                      ) : null}
                      {canResize ? (
                        <span
                          data-export-hide=""
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                          onPointerDown={begin("resize")}
                          onPointerMove={track}
                          onPointerUp={finish}
                          onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {legend ? <div className="border-t px-5 py-2" style={{ borderColor: settings.gridLine, background: settings.pageBg, color: settings.timeText }}>{legend}</div> : null}
      {settings.showFooter ? (
        <p className="rounded-b-2xl px-5 py-3 text-xs" style={{ color: settings.footerColor }}>
          {settings.footerText || t("exportFooter", { ns: PAGE.App })}
        </p>
      ) : null}
    </div>
  );
}

function ExportHide({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <span data-export-hide="" className="inline-flex shrink-0 overflow-visible">
      {children}
    </span>
  );
}

function TimetableTitle({
  label,
  interactive,
  color,
  fontSize,
  onCommit,
}: {
  label: string;
  interactive: boolean;
  color: string;
  fontSize: number;
  onCommit?: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

  useEffect(() => {
    setDraft(label);
  }, [label]);

  useEffect(() => {
    if (!editing) return;
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    node.select();
  }, [editing]);

  const commit = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      setEditing(false);
      setDraft(label);
      return;
    }
    const next = draft.trim();
    setEditing(false);
    if (!next || next === label) {
      setDraft(label);
      return;
    }
    onCommit?.(next);
  };

  if (editing && interactive) {
    return (
      <input
        ref={inputRef}
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            skipCommitRef.current = true;
            event.currentTarget.blur();
          }
        }}
        className="min-w-[8rem] max-w-full rounded-md border border-current/25 bg-transparent px-1.5 py-0.5 font-semibold leading-tight outline-none"
        style={{ color, fontSize }}
      />
    );
  }

  if (!interactive || !onCommit) {
    return (
      <h2 className="min-w-0 truncate font-semibold leading-tight" style={{ color, fontSize }}>
        {label}
      </h2>
    );
  }

  return (
    <button
      type="button"
      className="min-w-0 cursor-text truncate rounded-md border-0 bg-transparent p-0 text-left font-semibold leading-tight hover:opacity-80"
      style={{ color, fontSize }}
      onClick={() => setEditing(true)}
    >
      {label}
    </button>
  );
}

function buildLayout(events: ScheduleEvent[], settings: TimetableSettings, columns: ScheduleColumn[]) {
  const visible = events.filter((event) => columns.some((column) => eventMatchesColumn(event, column)));
  const blocks: BlockEvent[] = visible.map((item) => ({
    id: item.id, item, startMin: timeToMinutes(item.startTime), endMin: timeToMinutes(item.endTime),
  }));
  let startMin = timeToMinutes(settings.startTime);
  let endMin = timeToMinutes(settings.endTime);
  if (settings.autoBounds && blocks.length > 0) {
    startMin = Math.min(startMin, snapDown(Math.min(...blocks.map((event) => event.startMin)), settings.intervalMinutes));
    endMin = Math.max(endMin, snapUp(Math.max(...blocks.map((event) => event.endMin)), settings.intervalMinutes));
  }
  if (settings.collapseEmptyTime && blocks.length > 0) {
    const collapsed = collapseIdleBounds(Math.min(...blocks.map((event) => event.startMin)), Math.max(...blocks.map((event) => event.endMin)), settings.intervalMinutes);
    startMin = collapsed.startMin;
    endMin = collapsed.endMin;
  }
  const slots = buildTimeSlots(minutesToTime(startMin), minutesToTime(endMin), settings.intervalMinutes);
  const byColumn = Object.fromEntries(columns.map((column) => [column.key,
    layoutOverlaps(blocks.filter((block) => eventMatchesColumn(block.item, column))),
  ]));
  return { slots, byColumn, startMin, endMin };
}
