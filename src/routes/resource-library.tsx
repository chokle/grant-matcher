import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/resource-library")({
  head: () => ({
    meta: [
      { title: "Resource Library — GrantMatch Canada" },
      {
        name: "description",
        content:
          "Guides on writing Canadian grant applications, SR&ED claims, and preparing financial documents.",
      },
      { property: "og:title", content: "Resource Library — GrantMatch Canada" },
      {
        property: "og:description",
        content: "Practical guides for winning Canadian government funding.",
      },
    ],
  }),
  component: ResourceLibrary,
});

const RESOURCES = [
  {
    title: "Anatomy of a winning application",
    body: "Reviewers score problem, plan, and capacity. Lead with the measurable outcome, then prove you can deliver it.",
  },
  {
    title: "SR&ED tax credits explained",
    body: "If you resolve technological uncertainty, you can recover a large share of eligible R&D salaries — keep dated technical notes all year.",
  },
  {
    title: "Documents to have ready",
    body: "Articles of incorporation, two years of financial statements, a project budget, and CVs for key technical staff.",
  },
  {
    title: "Stacking federal and provincial funding",
    body: "Most programs allow stacking up to a total assistance limit. Check the limit before you commit matching funds.",
  },
  {
    title: "Common rejection reasons",
    body: "Wrong province, missing incorporation date, budget that doesn't match the narrative, and applying after the intake closed.",
  },
];

function ResourceLibrary() {
  return (
    <div className="px-5 py-8 md:px-10 md:py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        Resource library
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Short, practical guides for Canadian founders applying for government funding.
      </p>
      <ul className="mt-7 grid gap-4 lg:grid-cols-2">
        {RESOURCES.map((r) => (
          <li key={r.title} className="rounded-2xl border border-border bg-card p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <BookOpen className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{r.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
