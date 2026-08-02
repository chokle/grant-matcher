import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/help-center")({
  head: () => ({
    meta: [
      { title: "Help Center — GrantMatch Canada" },
      {
        name: "description",
        content: "Answers about match scores, saving programs, and AI-written grant letters.",
      },
      { property: "og:title", content: "Help Center — GrantMatch Canada" },
      {
        property: "og:description",
        content: "How GrantMatch scores your eligibility and writes application letters.",
      },
    ],
  }),
  component: HelpCenter,
});

const FAQ = [
  {
    q: "How is my match score calculated?",
    a: "AI compares your province, sector, stage, size and revenue against each program's stated eligibility, then scores 0–100 with a one-line reason.",
  },
  {
    q: "Is the funding data official?",
    a: "Programs are drawn from federal and provincial sources. Always confirm current intake dates on the program's own page before applying.",
  },
  {
    q: "Can I edit the generated letter?",
    a: "Yes. The letter is a first draft — copy it out, add your specifics and financials, and have someone review it before submitting.",
  },
  {
    q: "Do I need an account?",
    a: "You can browse every program without one. Saving programs, scoring matches and generating letters require a free account.",
  },
];

function HelpCenter() {
  return (
    <div className="px-5 py-8 md:px-10 md:py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        Help center
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Common questions about using GrantMatch Canada.
      </p>
      <Accordion type="single" collapsible className="mt-7 max-w-2xl">
        {FAQ.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="text-left text-sm font-semibold">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
