import { APP_NAME } from "@/constants";

export default function MiniWeek() {
  return (
    <div className="overflow-hidden rounded-xl border bg-background/80" aria-hidden>
      <div className="px-3 py-2" style={{ background: "#eef3fb", color: "#002145" }}>
        <p className="text-[9px] font-semibold tracking-wide uppercase">{APP_NAME}</p>
        <p className="text-xs font-semibold leading-tight">Winter Term 1</p>
      </div>
      <div className="grid grid-cols-6 border-b text-[10px] font-medium text-muted-foreground">
        {["", "Mon", "Tue", "Wed", "Thu", "Fri"].map((label) => (
          <div key={label || "time"} className="px-1.5 py-1.5">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 text-[10px]">
        <MiniRow time="9:00" blocks={[null, "cpen", null, "cpen", null]} />
        <MiniRow time="11:00" blocks={[null, null, "cpsc", null, "cpsc"]} />
        <MiniRow time="1:00" blocks={["chem", null, null, "chem", null]} />
        <MiniRow time="3:00" blocks={[null, null, null, null, null]} />
      </div>
    </div>
  );
}

function MiniRow({ time, blocks }: { time: string; blocks: Array<"cpen" | "cpsc" | "chem" | null> }) {
  const colors = {
    cpen: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    cpsc: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
    chem: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
  } as const;
  return (
    <>
      <div className="border-t px-1.5 py-3 text-muted-foreground">{time}</div>
      {blocks.map((block, index) => (
        <div key={`${time}-${index}`} className="border-t px-1 py-1">
          {block ? <div className={`h-full min-h-8 rounded-md ${colors[block]}`} /> : null}
        </div>
      ))}
    </>
  );
}
