import { CalendarDays } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

type Deadline = { id: string; name: string; deadline: string; min: number; max: number };

export function DeadlineCalendar({ deadlines }: { deadlines: Deadline[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const flagged = new Set(
    deadlines
      .map((d) => new Date(`${d.deadline}T00:00:00`))
      .filter((d) => d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate()),
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          <CalendarDays className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-foreground">Deadline Calendar</h3>
          <p className="text-xs text-muted-foreground">
            Upcoming grant &amp; loan application deadlines from your pipeline
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-semibold text-foreground">
            {first.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d} className="py-1 font-medium">
                {d}
              </span>
            ))}
            {cells.map((day, i) => (
              <span
                key={i}
                className={
                  day === null
                    ? ""
                    : flagged.has(day)
                      ? "grid aspect-square place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
                      : day === now.getDate()
                        ? "grid aspect-square place-items-center rounded-lg bg-secondary text-xs font-semibold text-foreground"
                        : "grid aspect-square place-items-center rounded-lg text-xs text-muted-foreground"
                }
              >
                {day ?? ""}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Next Deadlines</h4>
          <ul className="mt-3 space-y-3">
            {deadlines.length === 0 ? (
              <li className="text-xs text-muted-foreground">
                No upcoming deadlines in your pipeline yet.
              </li>
            ) : (
              deadlines.slice(0, 4).map((d) => (
                <li key={d.id} className="min-w-0 border-l-2 border-primary pl-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {formatDate(d.deadline)}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(d.min)}–{formatCurrency(d.max)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
