import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { profileSchema } from "@/lib/schemas";


export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyPipeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pipeline_items")
      .select("*, funding_programs(*)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const savePipelineItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        program_id: z.string().uuid(),
        status: z.string().max(30).default("saved"),
        match_score: z.number().int().min(0).max(100).nullish().transform((v) => v ?? null),
        match_reason: z.string().max(2000).nullish().transform((v) => v ?? null),

      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("pipeline_items")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,program_id" })
      .select("*, funding_programs(*)")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePipelineItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.string().max(30).nullish().transform((v) => v ?? undefined),
        notes: z.string().max(4000).nullish().transform((v) => v ?? undefined),
        generated_letter: z.string().max(20000).nullish().transform((v) => v ?? undefined),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: TablesUpdate<"pipeline_items"> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.generated_letter !== undefined) patch.generated_letter = data.generated_letter;
    const { data: row, error } = await context.supabase
      .from("pipeline_items")
      .update(patch)
      .eq("id", data.id)

      .eq("user_id", context.userId)
      .select("*, funding_programs(*)")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const removePipelineItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("pipeline_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyTimeEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", context.userId)
      .order("logged_on", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addTimeEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        pipeline_item_id: z.string().uuid(),
        hours: z.number().min(0.1).max(200),
        note: z.string().max(500).nullish().transform((v) => v ?? null),
        logged_on: z.string().max(20).nullish().transform((v) => v ?? new Date().toISOString().slice(0, 10)),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("time_entries")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTimeEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("time_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
