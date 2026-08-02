import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, FileText, Target, TrendingUp } from "lucide-react";
import { programsQuery, pipelineQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/format";
import { STATUS_LABELS, type PipelineStatus } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrantMatch Canada — AI Grant Matching for Canadian Startups" },
      {
        name: "description",
        content:
          "Discover Canadian government grants, loans and tax credits matched to your business, then track every application in one pipeline.",
      },
      { property: "og:title", content: "GrantMatch Canada — AI Grant Matching for Canadian Startups" },
      {
        property: "og:description",
        content:
          "Discover Canadian government grants, loans and tax credits matched to your business, then track every application in one pipeline.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: Target,
    title: "AI Match Scoring",
    body: "Every program is scored 0–100 against your province, sector, stage and revenue so you only chase what you can win.",
  },
  {
    icon: FileText,
    title: "Auto-Written Letters",
    body: "Generate a formal application letter tailored to each program's eligibility rules in a single click.",
  },
  {
    icon: TrendingUp,
    title: "Application Pipeline",
    body: "Track saved, in-progress, submitted and approved applications, plus the hours you spend on each.",
  },
];

function Home() {
  const { user } = useAuth();
  const programs = useQuery(programsQuery());
  const pipeline = useQuery(pipelineQuery(!!user));

  const total = programs.data?.length ?? 0;
  const maxTotal = (programs.data ?? []).reduce((sum, p) => sum + (p.max_amount ?? 0), 0);
  const items = pipeline.data ?? [];

  return (
    <div className="px-5 py-8 md:px-10 md:py-12">
      <section className="mx-auto max-w-5xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Sparkles className="size-3.5" />
          Canadian funding intelligence
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
          Stop guessing which government funding you qualify for.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          GrantMatch scans federal and provincial programs, scores your eligibility with AI, and
          writes the application letter for you.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Discover funding
            <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Set up my business
          </Link>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: `${total}+`, v: "Funding programs" },
            { k: formatCurrency(maxTotal), v: "Total funding tracked" },
            { k: "$85K", v: "Avg. funding per startup" },
            { k: "13", v: "Provinces & territories" },
          ].map((stat) => (
            <div key={stat.v} className="rounded-2xl border border-border bg-card p-5">
              <dt className="font-display text-2xl font-bold text-foreground md:text-3xl">
                {stat.k}
              </dt>
              <dd className="mt-1 text-xs text-muted-foreground">{stat.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto mt-14 max-w-5xl">
        <h2 className="font-display text-2xl font-bold text-foreground">How it works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {user && items.length > 0 ? (
        <section className="mx-auto mt-14 max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="min-w-0 truncate font-display text-2xl font-bold text-foreground">
              Your pipeline
            </h2>
            <Link to="/pipeline" className="shrink-0 text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <ul className="mt-5 grid gap-3">
            {items.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.funding_programs?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.funding_programs?.agency}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {STATUS_LABELS[item.status as PipelineStatus] ?? item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
