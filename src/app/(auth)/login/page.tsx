import Link from "next/link";
import { LogIn } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-[#080808] p-6">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo size="sm" />
          <h1 className="text-xl font-semibold">Masuk</h1>
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={login} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Email</span>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ff8400]"
              placeholder="nama@email.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ff8400]"
              placeholder="Password"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[linear-gradient(225deg,#fec07e_0%,#fe5501_48%,#d00307_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <LogIn aria-hidden="true" size={16} />
            Masuk
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/50">
          Belum punya akun?{" "}
          <Link className="font-medium text-white underline" href="/signup">
            Daftar
          </Link>
        </p>
      </section>
    </main>
  );
}
