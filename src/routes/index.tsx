import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  MapPin,
  PenLine,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { programsQuery, pipelineQuery, profileQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/format";
import { DeadlineCalendar } from "@/components/home/DeadlineCalendar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrantMatch Canada — Find Every Canadian Grant You Qualify For" },
      {
        name: "description",
        content:
          "Instantly match your business to 500+ Canadian government grants and loans. AI-scored match rates and auto-written application letters in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:title",
        content: "GrantMatch Canada — Find Every Canadian Grant You Qualify For",
      },
      {
        property: "og:description",
        content:
          "Instantly match your business to 500+ Canadian government grants and loans. AI-scored match rates and auto-written application letters in minutes.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: MapPin,
    title: "Hyper-Local Matching",
    body: "Federal, provincial, and municipal grants matched to your exact location and sector.",
  },
  {
    icon: Target,
    title: "AI Match Scoring",
    body: "Each grant scored 0–100% on your likelihood of acceptance with a plain-language explanation.",
  },
  {
    icon: PenLine,
    title: "Auto-Written Letters",
    body: "Professional application letters written by AI, tailored to each grant's specific requirements.",
  },
];

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const programs = useQuery(programsQuery());
  const pipeline = useQuery(pipelineQuery(!!user));
  const profile = useQuery(profileQuery(!!user));

  const items = pipeline.data ?? [];
  const allPrograms = useMemo(() => programs.data ?? [], [programs.data]);
  const mySector = profile.data?.sector ?? null;

  const totalPotential = items.length
    ? items.reduce((s, i) => s + (i.funding_programs?.max_amount ?? 0), 0)
    : allPrograms.reduce((s, p) => s + (p.max_amount ?? 0), 0);
  const submitted = items.filter((i) =>
    ["submitted", "approved", "rejected"].includes(i.status),
  ).length;
  const approved = items.filter((i) => i.status === "approved").length;
  const approvedFunding = items
    .filter((i) => i.status === "approved")
    .reduce((s, i) => s + (i.funding_programs?.max_amount ?? 0), 0);

  const now = new Date();
  const monthName = now.toLocaleDateString("en-CA", { month: "long" });
  const monthDeadlines = items.filter((i) => {
    const d = i.funding_programs?.deadline;
    if (!d) return false;
    const date = new Date(`${d}T00:00:00`);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthAmount = monthDeadlines.reduce(
    (s, i) => s + (i.funding_programs?.max_amount ?? 0),
    0,
  );

  const successRate = submitted ? Math.round((approved / submitted) * 100) : 0;

  const sectorData = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const p of allPrograms) {
      for (const s of p.sectors ?? []) {
        const e = map.get(s) ?? { total: 0, count: 0 };
        e.total += p.max_amount ?? 0;
        e.count += 1;
        map.set(s, e);
      }
    }
    return [...map.entries()]
      .map(([sector, e]) => ({
        sector,
        value: Math.round(e.total / e.count),
        count: e.count,
        mine: sector === mySector,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [allPrograms, mySector]);

  const mine = sectorData.find((s) => s.mine);

  const stageData = useMemo(() => {
    const labels: Record<string, string> = {
      saved: "Saved",
      in_progress: "In Progress",
      submitted: "Submitted",
      approved: "Approved",
    };
    return Object.entries(labels)
      .map(([key, label]) => ({
        stage: label,
        value: items
          .filter((i) => i.status === key)
          .reduce((s, i) => s + (i.funding_programs?.max_amount ?? 0), 0),
      }))
      .filter((d) => d.value > 0);
  }, [items]);

  const deadlines = useMemo(
    () =>
      items
        .filter((i) => i.funding_programs?.deadline)
        .map((i) => ({
          id: i.id,
          name: i.funding_programs?.name ?? "",
          deadline: i.funding_programs!.deadline as string,
          min: i.funding_programs?.min_amount ?? 0,
          max: i.funding_programs?.max_amount ?? 0,
        }))
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [items],
  );

  function analyze() {
    if (url.trim()) {
      try {
        sessionStorage.setItem("gm:analyze-url", url.trim());
      } catch {
        /* ignore */
      }
    }
    void navigate({ to: "/profile" });
  }

  const kpis = [
    {
      icon: DollarSign,
      value: formatCurrency(totalPotential),
      label: "Total Potential Funding",
    },
    { icon: FileText, value: String(submitted), label: "Applications Submitted" },
    { icon: CheckCircle2, value: String(approved), label: "Approved / Accepted" },
    { icon: TrendingUp, value: formatCurrency(approvedFunding), label: "Approved Funding" },
  ];

  return (
    <div>
      <header className="hidden items-center justify-end border-b border-border bg-card px-8 py-4 md:flex">
        <span className="relative grid size-9 place-items-center rounded-xl text-muted-foreground">
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            1
          </span>
        </span>
      </header>

      <div className="px-5 py-10 md:px-10 md:py-12">
        <section className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
            <Sparkles className="size-3.5" />
            AI-Powered Canadian Grant Matching
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Find Every Canadian Grant
            <br />
            <span className="text-primary">Your Startup Qualifies For</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Instantly match your business to 500+ Canadian government grants and loans. Get
            AI-scored match rates and auto-written application letters — in minutes.
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full">
            <span className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <Globe className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="yourcompany.com — we'll analyze it instantly"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </span>
            <button
              type="button"
              onClick={analyze}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Analyze My Business
              <ArrowRight className="size-4" />
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Or{" "}
            <Link to="/profile" className="font-medium text-foreground underline">
              fill out your business profile manually
            </Link>
          </p>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { k: "500+", v: "Grants & Loans Tracked" },
              { k: "13", v: "Canadian Provinces Covered" },
              { k: "$85K", v: "Avg. Funding per Startup" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-border bg-card p-6">
                <dt className="font-display text-3xl font-extrabold text-primary">{s.k}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mx-auto mt-8 max-w-6xl space-y-6">
          <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl bg-primary p-6 text-primary-foreground">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-90">
                <CalendarClock className="size-4 shrink-0" />
                {monthName} Deadlines
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold">
                {formatCurrency(monthAmount)}
              </p>
              <p className="mt-1 text-sm opacity-90">
                {monthDeadlines.length
                  ? `${monthDeadlines.length} grant${monthDeadlines.length > 1 ? "s" : ""} due this month`
                  : "No grants due this month"}
              </p>
            </div>
            <Link
              to="/pipeline"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-semibold"
            >
              View pipeline
              <ArrowRight className="size-3.5" />
            </Link>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                  <k.icon className="size-4" />
                </span>
                <p className="mt-4 font-display text-2xl font-extrabold text-foreground">
                  {k.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Trophy className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-foreground">
                    Application Success Rate
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Accepted applications out of submitted
                  </p>
                </div>
              </div>

              <div className="mt-4 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Accepted", value: approved || 0 },
                        { name: "Remaining", value: Math.max(submitted - approved, submitted ? 0 : 1) },
                      ]}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill="var(--color-chart-1)" />
                      <Cell fill="var(--color-muted)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="-mt-28 text-center font-display text-3xl font-extrabold text-foreground">
                {successRate}%
              </p>
              <div className="mt-20 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span>Accepted {approved}</span>
                <span>Submitted {submitted}</span>
              </div>
              {submitted === 0 ? (
                <p className="mt-4 rounded-xl bg-secondary p-3 text-center text-xs text-muted-foreground">
                  No applications submitted yet. Once you apply, your success rate will appear here.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <TrendingUp className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-foreground">
                    Funding by Sector
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Average available funding across top sectors
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-1" /> Your industry
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-2" /> Other sectors
                </span>
              </div>
              {mine ? (
                <p className="mt-3 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
                  Your industry ({mine.sector}) has {formatCurrency(mine.value)} in average
                  available funding across {mine.count} opportunities.
                </p>
              ) : null}
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => formatCurrency(v)}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="sector"
                      width={96}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)" }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {sectorData.map((d) => (
                        <Cell
                          key={d.sector}
                          fill={d.mine ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <DeadlineCalendar deadlines={deadlines} />

          <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h3 className="font-display text-base font-bold text-foreground">
              Potential Funding by Application Stage
            </h3>
            <p className="text-xs text-muted-foreground">
              Total funding value of opportunities at each pipeline stage
            </p>
            <div className="mt-4 h-56">
              {stageData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => formatCurrency(v)}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      width={90}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)" }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Bar dataKey="value" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="grid h-full place-items-center text-xs text-muted-foreground">
                  Save grants to your pipeline to see funding by stage.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
