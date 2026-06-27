import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/responses";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AuthResult =
  | {
      ok: true;
      supabase: SupabaseServerClient;
      user: User;
    }
  | {
      ok: false;
      response: ReturnType<typeof errorResponse>;
    };

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: errorResponse("Kamu harus login dulu.", 401),
    };
  }

  return {
    ok: true,
    supabase,
    user,
  };
}
