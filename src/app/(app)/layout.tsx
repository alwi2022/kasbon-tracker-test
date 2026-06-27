import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const emailName = user.email?.split("@")[0].trim();
  const userName = emailName || "User";

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="text-sm font-semibold">Kasbon Tracker</span>
          </Link>

          <LogoutButton name={userName} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </main>
  );
}
