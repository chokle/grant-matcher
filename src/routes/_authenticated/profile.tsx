import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { profileQuery } from "@/lib/queries";
import { saveMyProfile } from "@/lib/app.functions";
import { analyzeWebsite } from "@/lib/ai.functions";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";
import { PROVINCES, SECTORS, STAGES } from "@/lib/constants";
import type { ProfileInput } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Business Profile — GrantMatch Canada" },
      {
        name: "description",
        content:
          "Tell GrantMatch about your Canadian business so AI can score which government funding you qualify for.",
      },
      { property: "og:title", content: "My Business Profile — GrantMatch Canada" },
      {
        property: "og:description",
        content: "Your business details power AI grant match scoring.",
      },
    ],
  }),
  component: ProfilePage,
});

const EMPTY: ProfileInput = {
  business_name: "",
  website: "",
  province: "Ontario",
  sector: "Technology",
  stage: "Early revenue",
  employees: null,
  annual_revenue: null,
  incorporation_date: null,
  description: "",
};

function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery(true));
  const [form, setForm] = useState<ProfileInput>(EMPTY);

  useEffect(() => {
    if (profile.data) setForm({ ...EMPTY, ...profile.data } as ProfileInput);
  }, [profile.data]);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("gm:analyze-url");
      if (pending) {
        sessionStorage.removeItem("gm:analyze-url");
        setForm((prev) => ({ ...prev, website: pending }));
      }
    } catch {
      /* ignore */
    }
  }, []);


  const save = useMutation({
    mutationFn: () => saveMyProfile({ data: form }),
    onSuccess: () => {
      toast.success("Profile saved");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const analyze = useMutation({
    mutationFn: () => analyzeWebsite({ data: { url: form.website ?? "" } }),
    onSuccess: (data) => {
      setForm((prev) => ({
        ...prev,
        business_name: prev.business_name || data.business_name,
        province: data.province,
        sector: data.sector,
        stage: data.stage,
        description: data.description,
      }));
      toast.success("Profile pre-filled from your website");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Analysis failed"),
  });

  const field = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="px-5 py-8 md:px-10 md:py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        My business
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        These details are what the AI uses to score your fit against every funding program.
      </p>

      <form
        className="mt-7 grid max-w-2xl gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          Business name
          <input
            required
            className={field}
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          Website
          <div className="flex gap-2">
            <input
              className={field}
              placeholder="yourcompany.ca"
              value={form.website ?? ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <button
              type="button"
              disabled={!form.website || analyze.isPending}
              onClick={() => analyze.mutate()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {analyze.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              <span className="hidden sm:inline">Analyze</span>
            </button>
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Province
            <ResponsiveSelect
              label="Province"
              value={form.province ?? "Ontario"}
              onChange={(province) => setForm({ ...form, province })}
              options={PROVINCES.map((p) => ({ value: p, label: p }))}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Sector
            <ResponsiveSelect
              label="Sector"
              value={form.sector ?? "Technology"}
              onChange={(sector) => setForm({ ...form, sector })}
              options={SECTORS.map((s) => ({ value: s, label: s }))}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Stage
            <ResponsiveSelect
              label="Stage"
              value={form.stage ?? "Early revenue"}
              onChange={(stage) => setForm({ ...form, stage })}
              options={STAGES.map((s) => ({ value: s, label: s }))}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Employees
            <input
              type="number"
              min={0}
              className={field}
              value={form.employees ?? ""}
              onChange={(e) =>
                setForm({ ...form, employees: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Annual revenue (CAD)
            <input
              type="number"
              min={0}
              className={field}
              value={form.annual_revenue ?? ""}
              onChange={(e) =>
                setForm({ ...form, annual_revenue: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Incorporated
            <input
              type="date"
              className={field}
              value={form.incorporation_date ?? ""}
              onChange={(e) => setForm({ ...form, incorporation_date: e.target.value || null })}
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          What does your business do?
          <textarea
            rows={4}
            className="w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <button
          type="submit"
          disabled={save.isPending}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-40"
        >
          {save.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
