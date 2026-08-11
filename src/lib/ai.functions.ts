import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const analyzeWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().min(3).max(300) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const normalized = data.url.startsWith("http") ? data.url : `https://${data.url}`;
    let pageText = "";
    try {
      const res = await fetch(normalized, { headers: { "User-Agent": "GrantMatchBot/1.0" } });
      const html = await res.text();
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 6000);
    } catch {
      pageText = "";
    }

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({
          schema: z.object({
            business_name: z.string(),
            province: z.string(),
            sector: z.string(),
            stage: z.string(),
            description: z.string(),
          }),
        }),
        prompt: `You analyze Canadian business websites to prefill a grant-matching profile.
Website: ${normalized}
Page content: ${pageText || "(could not load page — infer from the domain name only)"}

Return a best-guess profile. province must be one full Canadian province or territory name (use "Ontario" if unknown). sector must be one of: Technology, R&D, Manufacturing, CleanTech, Health, Agriculture, Retail, Hospitality, Energy, Engineering, Science, Innovation, Commercialization, Startup, Entrepreneurship. stage must be one of: Idea, Pre-revenue, Early revenue, Growth, Established. description: two sentences about what the business does.`,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not analyze that website. Try filling the profile manually.");
      }
      throw error;
    }
  });

export const scoreMyMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) throw new Error("Add your business profile first.");

    const today = new Date().toISOString().slice(0, 10);
    const { data: programs } = await context.supabase
      .from("funding_programs")
      .select(
        "id, name, agency, level, province, funding_type, sectors, min_amount, max_amount, eligibility",
      )
      .neq("status", "closed")
      .or(`deadline.is.null,deadline.gte.${today}`);

    const list = (programs ?? []).map((p) => ({
      id: p.id,
      n: p.name,
      lvl: p.level,
      prov: p.province,
      sec: p.sectors,
      elig: p.eligibility?.slice(0, 160),
    }));

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({
          schema: z.object({
            matches: z.array(
              z.object({
                id: z.string(),
                score: z.number(),
                reason: z.string(),
              }),
            ),
          }),
        }),
        prompt: `Score how likely this Canadian business is to be accepted for each funding program, 0-100.

Business profile:
${JSON.stringify({
  name: profile.business_name,
  province: profile.province,
  sector: profile.sector,
  stage: profile.stage,
  employees: profile.employees,
  revenue: profile.annual_revenue,
  incorporated: profile.incorporation_date,
  about: profile.description,
})}

Programs (JSON):
${JSON.stringify(list)}

Return one entry per program id. Score honestly: programs from another province should score under 20. reason must be one plain-language sentence under 160 characters explaining the score.`,
      });
      return output.matches.map((m) => ({
        id: m.id,
        score: Math.max(0, Math.min(100, Math.round(m.score))),
        reason: m.reason.slice(0, 400),
      }));
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Match scoring failed. Please try again.");
      }
      throw error;
    }
  });

export const generateApplicationLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pipeline_item_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { data: item } = await context.supabase
      .from("pipeline_items")
      .select("*, funding_programs(*)")
      .eq("id", data.pipeline_item_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!item) throw new Error("Pipeline item not found.");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      prompt: `Write a professional Canadian grant application letter.

Program: ${JSON.stringify(item.funding_programs)}
Applicant business: ${JSON.stringify(profile ?? {})}

Requirements: formal business letter format, 350-500 words, address the program's stated eligibility directly, reference the province and sector, avoid inventing specific financial figures that were not provided, and end with a clear ask. Return the letter body only, no commentary.`,
    });

    const { data: row, error } = await context.supabase
      .from("pipeline_items")
      .update({ generated_letter: text })
      .eq("id", data.pipeline_item_id)
      .eq("user_id", context.userId)
      .select("*, funding_programs(*)")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
