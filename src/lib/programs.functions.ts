import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type FundingProgram = Database["public"]["Tables"]["funding_programs"]["Row"];

export const listFundingPrograms = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await client
    .from("funding_programs")
    .select("*")
    .neq("status", "closed")
    .or(`deadline.is.null,deadline.gte.${today}`)
    .order("max_amount", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FundingProgram[];
});
