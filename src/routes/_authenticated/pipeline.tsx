import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, FileText } from "lucide-react";
import { pipelineQuery, type PipelineRow } from "@/lib/queries";
import { updatePipelineItem, removePipelineItem } from "@/lib/app.functions";
import { generateApplicationLetter } from "@/lib/ai.functions";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";
import { PIPELINE_STATUSES, STATUS_LABELS, type PipelineStatus } from "@/lib/constants";
import { formatRange } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "My Grant Pipeline — GrantMatch Canada" },
      {
        name: "description",
        content: "Track saved, in-progress and submitted Canadian grant applications in one place.",
      },
      { property: "og:title", content: "My Grant Pipeline — GrantMatch Canada" },
      {
        property: "og:description",
        content: "Manage every Canadian funding application you are working on.",
      },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  const queryClient = useQueryClient();
  const pipeline = useQuery(pipelineQuery(true));
  const items = pipeline.data ?? [];

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      updatePipelineItem({ data: { id: vars.id, status: vars.status } }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      const previous = queryClient.getQueryData<PipelineRow[]>(["pipeline"]);
      queryClient.setQueryData<PipelineRow[]>(["pipeline"], (old) =>
        (old ?? []).map((i) => (i.id === vars.id ? { ...i, status: vars.status } : i)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["pipeline"], ctx?.previous);
      toast.error("Could not update status");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removePipelineItem({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      const previous = queryClient.getQueryData<PipelineRow[]>(["pipeline"]);
      queryClient.setQueryData<PipelineRow[]>(["pipeline"], (old) =>
        (old ?? []).filter((i) => i.id !== id),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["pipeline"], ctx?.previous);
      toast.error("Could not remove that item");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const letter = useMutation({
    mutationFn: (id: string) => generateApplicationLetter({ data: { pipeline_item_id: id } }),
    onSuccess: () => {
      toast.success("Letter generated");
      void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not write the letter"),
  });

  return (
    <div className="px-5 py-8 md:px-10 md:py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        My pipeline
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {items.length} program{items.length === 1 ? "" : "s"} saved
      </p>

      <ul className="mt-6 grid gap-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {item.funding_programs?.name}
                </h2>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {item.funding_programs?.agency} ·{" "}
                  {formatRange(
                    item.funding_programs?.min_amount ?? 0,
                    item.funding_programs?.max_amount ?? 0,
                  )}
                </p>
              </div>
              {item.match_score !== null ? (
                <span className="shrink-0 rounded-xl bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground">
                  {item.match_score}
                </span>
              ) : null}
            </div>

            {item.match_reason ? (
              <p className="mt-3 text-sm text-muted-foreground">{item.match_reason}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="w-44">
                <ResponsiveSelect
                  label="Status"
                  value={item.status}
                  onChange={(status) => setStatus.mutate({ id: item.id, status })}
                  options={PIPELINE_STATUSES.map((s) => ({
                    value: s,
                    label: STATUS_LABELS[s as PipelineStatus],
                  }))}
                />
              </div>
              <button
                type="button"
                onClick={() => letter.mutate(item.id)}
                disabled={letter.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {letter.isPending && letter.variables === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                {item.generated_letter ? "Rewrite letter" : "Write letter"}
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(item.id)}
                aria-label="Remove"
                className="ml-auto grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-accent"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {item.generated_letter ? (
              <details className="mt-4 rounded-xl bg-muted p-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Application letter
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {item.generated_letter}
                </p>
              </details>
            ) : null}
          </li>
        ))}
      </ul>

      {!pipeline.isLoading && items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nothing saved yet — head to Discover Funding and save the programs you want to chase.
        </p>
      ) : null}
    </div>
  );
}
