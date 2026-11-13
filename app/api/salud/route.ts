import { connection } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
export async function GET() {
  // Con Cache Components el GET se prerenderiza salvo que se indique lo
  // contrario; el chequeo debe ejecutarse en cada petición.
  await connection();
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[salud] Supabase respondió ${response.status} ${response.statusText}`);
      return Response.json({ supabase: "error" }, { status: 503 });
    }
    return Response.json({ supabase: "ok" });
  } catch (error) {
    console.error("[salud] No se pudo contactar con Supabase:", error);
    return Response.json({ supabase: "error" }, { status: 503 });
  }
}
