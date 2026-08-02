import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, Bookmark, BookmarkCheck, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { programsQuery, pipelineQuery, type PipelineRow } from "@/lib/queries";
import { addToPipeline } from "@/lib/app.functions";
import { scoreMyMatches } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/useAuth";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";
import { PROVINCES, SECTORS, FUNDING_TYPE_LABELS } from "@/lib/constants";
import { formatRange, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Canadian Funding Programs — GrantMatch" },
      {
        name: "description",
        content:
          "Browse 40+ federal and provincial grants, loans and tax credits for Canadian businesses, filtered by province, sector and funding type.",
      },
      { property: "og:title", content: "Discover Canadian Funding Programs" },
      {
        property: "og:description",
        content: "Filter Canadian government grants by province, sector and funding type.",
      },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const programs = useQuery(programsQuery());
  const pipeline = useQuery(pipelineQuery(!!user));

  const [q, setQ] = useState("");
  const [province, setProvince] = useState("all");
  const [sector, setSector] = useState("all");
  const [type, setType] = useState("all");
  const [scores, setScores] = useState<Record<string, { score: number; reason: string }>>({});

  const { pull, refreshing } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ["funding-programs"] });
  });

  const saved = useMemo(
    () => new Set((pipeline.data ?? []).map((p: PipelineRow) => p.program_id)),
    [pipeline.data],
  );

  const save = useMutation({
    mutationFn: (programId: string) => {
      const match = scores[programId];
      return addToPipeline({
        data: {
          program_id: programId,
          status: "saved",
          match_score: match?.score ?? null,
          match_reason: match?.reason ?? null,
        },
      });
    },
    onMutate: async (programId: string) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      const previous = queryClient.getQueryData<PipelineRow[]>(["pipeline"]);
      const program = (programs.data ?? []).find((p) => p.id === programId);
      queryClient.setQueryData<PipelineRow[]>(["pipeline"], (old) => [
        {
          id: `optimistic-${programId}`,
          program_id: programId,
          status: "saved",
          notes: null,
          generated_letter: null,
          match_score: scores[programId]?.score ?? null,
          match_reason: scores[programId]?.reason ?? null,
          user_id: "optimistic",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          funding_programs: program ?? null,
        } as unknown as PipelineRow,
        ...(old ?? []),
      ]);
      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      queryClient.setQueryData(["pipeline"], ctx?.previous);
      toast.error("Could not save that program");
    },
    onSuccess: () => toast.success("Added to your pipeline"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const score = useMutation({
    mutationFn: () => scoreMyMatches(),
    onSuccess: (rows) => {
      const next: Record<string, { score: number; reason: string }> = {};
      for (const row of rows) next[row.id] = { score: row.score, reason: row.reason };
      setScores(next);
      toast.success("Matches scored");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Scoring failed"),
  });

  const filtered = useMemo(() => {
    const list = (programs.data ?? []).filter((p) => {
      if (q && !`${p.name} ${p.agency} ${p.description}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (province !== "all" && p.province !== province && p.province !== "Canada") return false;
      if (sector !== "all" && !p.sectors.includes(sector)) return false;
      if (type !== "all" && p.funding_type !== type) return false;
      return true;
    });
    if (Object.keys(scores).length === 0) return list;
    return [...list].sort((a, b) => (scores[b.id]?.score ?? -1) - (scores[a.id]?.score ?? -1));
  }, [programs.data, q, province, sector, type, scores]);

  return (
    <div className="px-5 py-8 md:px-10 md:py-12" style={{ paddingTop: pull ? pull + 16 : undefined }}>
      {pull > 0 || refreshing ? (
        <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className={cn("size-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing…" : "Pull to refresh"}
        </div>
      ) : null}

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Discover funding
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} of {programs.data?.length ?? 0} Canadian programs
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              void navigate({ to: "/auth", search: { redirect: "/discover" } });
              return;
            }
            score.mutate();
          }}
          disabled={score.isPending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {score.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          <span className="hidden sm:inline">Score my matches</span>
          <span className="sm:hidden">Score</span>
        </button>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-4 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search programs"
            className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <ResponsiveSelect
          label="Province"
          value={province}
          onChange={setProvince}
          options={[
            { value: "all", label: "All provinces" },
            ...PROVINCES.map((p) => ({ value: p, label: p })),
          ]}
        />
        <ResponsiveSelect
          label="Sector"
          value={sector}
          onChange={setSector}
          options={[
            { value: "all", label: "All sectors" },
            ...SECTORS.map((s) => ({ value: s, label: s })),
          ]}
        />
        <ResponsiveSelect
          label="Funding type"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "All types" },
            ...Object.entries(FUNDING_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
      </div>

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {filtered.map((p) => {
          const match = scores[p.id];
          const isSaved = saved.has(p.id);
          return (
            <li key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold leading-snug text-foreground">
                    {p.name}
                  </h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {p.agency} · {p.province}
                  </p>
                </div>
                {match ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold",
                      match.score >= 70
                        ? "bg-primary text-primary-foreground"
                        : match.score >= 40
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {match.score}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {match?.reason ?? p.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                  {formatRange(p.min_amount, p.max_amount)}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                  {FUNDING_TYPE_LABELS[p.funding_type] ?? p.funding_type}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                  {formatDate(p.deadline)}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaved}
                  onClick={() => {
                    if (!user) {
                      void navigate({ to: "/auth", search: { redirect: "/discover" } });
                      return;
                    }
                    save.mutate(p.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    isSaved
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {isSaved ? (
                    <BookmarkCheck className="size-4" />
                  ) : (
                    <Bookmark className="size-4" />
                  )}
                  {isSaved ? "Saved" : "Save"}
                </button>
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    Details
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {programs.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading programs…</p>
      ) : null}
      {!programs.isLoading && filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No programs match those filters. Try widening your search.
        </p>
      ) : null}
    </div>
  );
}
