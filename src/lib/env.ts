function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi.`);
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}
