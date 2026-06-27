"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=Email dan password wajib diisi");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password minimal 6 karakter");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect("/signup?error=Gagal bikin akun. Coba email lain ya");
  }

  redirect("/login?message=Akun berhasil dibuat. Sekarang masuk ya");
}
