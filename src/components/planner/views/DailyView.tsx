import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClockIcon, CopyIcon, StarIcon, XIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Input } from "@/components/ui/input";
import { EventCard, StatCard, ViewHeader, fmtHours, fmtTime, type ViewProps } from "./parts";
import { createId } from "@/utils/ids";
import { addDays, eventMinutes } from "@/utils/schedule";
import { layoutOverlaps } from "@/utils/overlaps";
import { minutesToTime, timeToMinutes } from "@/utils/time";

const ROW = 64;
const MAX_TOP = 3;

export default function DailyView({ doc, segments, title, today, dateLabel, onEdit, onCreate, update, copyDay }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const hour24 = doc.prefs.hour24;
  const date = doc.date;
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const todos = doc.todos ?? [];
  const mine = todos.filter((todo) => todo.date === date);
  const top = mine.filter((todo) => todo.top);
  const rest = mine.filter((todo) => !todo.top);
  const setTodos = (next: typeof todos) => update({ todos: next.length ? next : undefined });
  const patchTodo = (id: string, patch: Partial<(typeof todos)[number]>) => setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)));
  const addTodo = () => { const text = draft.trim(); if (!text) return; setTodos([...todos, { id: createId(), date, title: text, done: false }]); setDraft(""); };
  const carry = todos.filter((todo) => todo.date === addDays(date, -1) && !todo.done && !mine.some((item) => item.title === todo.title));
  const items = segments.filter((event) => event.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const settingsStart = Math.floor(timeToMinutes(doc.settings.startTime) / 60);
  const settingsEnd = Math.ceil(timeToMinutes(doc.settings.endTime) / 60);
  const first = Math.max(0, Math.min(settingsStart, ...items.map((event) => Math.floor(timeToMinutes(event.startTime) / 60))));
  const last = Math.min(24, Math.max(settingsEnd, ...items.map((event) => Math.ceil(timeToMinutes(event.endTime) / 60))));
  const laid = layoutOverlaps(items.map((event) => ({ id: event.id, startMin: timeToMinutes(event.startTime), endMin: timeToMinutes(event.endTime), event })));
  const planned = items.reduce((sum, event) => sum + eventMinutes(event), 0) / 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow = date === today && nowMinutes >= first * 60 && nowMinutes <= last * 60;
  const doneCount = mine.filter((todo) => todo.done).length;
  const todoRow = (todo: (typeof todos)[number]) => <li key={todo.id} className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-sm">
    <Checkbox aria-label={t("markDone")} checked={todo.done} onCheckedChange={(checked) => patchTodo(todo.id, { done: Boolean(checked) })} />
    <span className={`min-w-0 flex-1 truncate ${todo.done ? "text-muted-foreground line-through" : ""}`}>{todo.title}</span>
    <Button size="icon-xs" variant="ghost" aria-label={t("views.daily.pin")} aria-pressed={Boolean(todo.top)} disabled={!todo.top && top.length >= MAX_TOP} onClick={() => patchTodo(todo.id, { top: !todo.top })}><StarIcon size={13} /></Button>
    <Button size="xs" variant="ghost" onClick={() => onCreate({ date, title: todo.title })}>{t("views.daily.schedule")}</Button>
    <Button size="icon-xs" variant="ghost" aria-label={t("delete")} onClick={() => setTodos(todos.filter((item) => item.id !== todo.id))}><XIcon size={12} /></Button>
  </li>;
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#fcfaf7] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={ClockIcon} kicker={dateLabel(date)} title={title} detail={t("views.daily.description")}
      actions={<HoverIconButton icon={CopyIcon} variant="outline" onClick={() => copyDay({ date: addDays(date, -1) }, [{ date }])}>{t("views.daily.copyYesterday")}</HoverIconButton>} />
    <div className="grid grid-cols-3 gap-3">
      <StatCard label={t("views.daily.planned")} value={fmtHours(planned)} />
      <StatCard label={t("views.daily.blocks")} value={items.filter((event) => !event.baseId || event.id.endsWith("#a")).length} />
      <StatCard label={t("views.daily.tasks")} value={mine.length ? `${doneCount}/${mine.length}` : "0"} />
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section className="space-y-4 self-start rounded-xl border bg-muted/20 p-4">
        <div><h3 className="text-sm font-semibold">{t("views.daily.topTitle")}</h3><p className="text-xs text-muted-foreground">{t("views.daily.topHint", { count: MAX_TOP })}</p>
          <ul className="mt-2 space-y-1.5">{top.map(todoRow)}{!top.length && <li className="rounded-lg border border-dashed p-2 text-xs text-muted-foreground">{t("views.daily.topEmpty")}</li>}</ul></div>
        <div><h3 className="text-sm font-semibold">{t("views.daily.todoTitle")}</h3>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addTodo(); }}><Input aria-label={t("views.daily.addTodo")} placeholder={t("views.daily.addTodo")} maxLength={160} value={draft} onChange={(e) => setDraft(e.target.value)} /><Button type="submit" variant="outline" disabled={!draft.trim()}>{t("views.daily.addTodoAction")}</Button></form>
          <ul className="mt-2 space-y-1.5">{rest.map(todoRow)}</ul>
          {carry.length > 0 && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setTodos([...todos, ...carry.map((todo) => ({ ...todo, id: createId(), date, done: false, top: false }))])}>{t("views.daily.carry", { count: carry.length })}</Button>}</div>
      </section>
      <div className="relative overflow-hidden rounded-xl border bg-background px-4 py-2">
        {Array.from({ length: last - first }, (_, index) => first + index).map((hour) => {
          const slot = minutesToTime(hour * 60);
          const occupied = items.some((event) => timeToMinutes(event.startTime) < (hour + 1) * 60 && timeToMinutes(event.endTime) > hour * 60);
          return <div key={hour} className="grid grid-cols-[64px_minmax(0,1fr)] border-b last:border-b-0" style={{ height: ROW }}><div className="border-r py-2 text-xs text-muted-foreground">{fmtTime(slot, hour24)}</div>{!occupied && <Button variant="ghost" className="m-1.5 h-auto justify-start text-xs text-muted-foreground/65 hover:text-foreground" onClick={() => onCreate({ date, time: slot })}>{t("views.daily.addBlock")}</Button>}</div>;
        })}
        {laid.map(({ event: row, column, columns }) => {
          const event = row.event;
          const start = timeToMinutes(event.startTime);
          const end = timeToMinutes(event.endTime);
          const share = 100 / columns;
          return <div key={event.id} className="absolute z-10" style={{ top: 8 + (start / 60 - first) * ROW + 2, height: Math.max(32, ((end - start) / 60) * ROW - 4), left: `calc(88px + (100% - 104px) * ${column * share / 100})`, width: `calc((100% - 104px) * ${share / 100} - 4px)` }}>
            <EventCard event={event} hour24={hour24} compact fill onClick={() => onEdit(event)} />
          </div>;
        })}
        {showNow && <div data-export-hide="" aria-label={t("views.daily.now")} className="pointer-events-none absolute right-2 left-14 z-20 flex items-center" style={{ top: 8 + ((nowMinutes - first * 60) / 60) * ROW }}><span className="size-2 rounded-full bg-red-500" /><span className="h-px flex-1 bg-red-500" /></div>}
      </div>
    </div>
  </div>;
}
