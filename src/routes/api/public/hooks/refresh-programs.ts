import { createFileRoute } from "@tanstack/react-router";

type ProgramRow = {
  id: string;
  name: string;
  url: string | null;
  deadline: string | null;
  status: string;
};

async function checkUrl(url: string): Promise<"ok" | "gone" | "unknown"> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    clearTimeout(timer);
    if (res.status === 404 || res.status === 410) return "gone";
    if (res.ok || res.status < 500) return "ok";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export const Route = createFileRoute("/api/public/hooks/refresh-programs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];

        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date().toISOString().slice(0, 10);

        // 1. Close programs whose deadline has passed.
        const { data: expired, error: expireError } = await supabaseAdmin
          .from("funding_programs")
          .update({ status: "closed", last_verified_at: today })
          .lt("deadline", today)
          .neq("status", "closed")
          .select("id");

        if (expireError) {
          console.error("refresh-programs expire failed", expireError);
          return new Response(JSON.stringify({ error: expireError.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // 2. Re-validate links for programs that are still open.
        const { data: programs, error: readError } = await supabaseAdmin
          .from("funding_programs")
          .select("id, name, url, deadline, status")
          .neq("status", "closed")
          .order("last_verified_at", { ascending: true })
          .limit(60);

        if (readError) {
          console.error("refresh-programs read failed", readError);
          return new Response(JSON.stringify({ error: readError.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let verified = 0;
        let flagged = 0;

        for (const program of (programs ?? []) as ProgramRow[]) {
          if (!program.url) continue;
          const result = await checkUrl(program.url);
          if (result === "unknown") continue;

          const nextStatus = result === "gone" ? "closed" : "open";
          if (result === "gone") flagged += 1;
          else verified += 1;

          const { error: updateError } = await supabaseAdmin
            .from("funding_programs")
            .update({ status: nextStatus, last_verified_at: today })
            .eq("id", program.id);

          if (updateError) console.error("refresh-programs update failed", program.name, updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            checked_at: today,
            expired_by_deadline: expired?.length ?? 0,
            verified,
            closed_dead_links: flagged,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
