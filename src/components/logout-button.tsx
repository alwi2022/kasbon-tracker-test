import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

type LogoutButtonProps = {
  name: string;
};

export function LogoutButton({ name }: LogoutButtonProps) {
  const initial = name.charAt(0).toUpperCase() || "U";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full px-1 py-1 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-[#ff8400]/70 [&::-webkit-details-marker]:hidden">
        <span className="hidden text-sm font-medium text-white sm:block">
          {name}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white text-sm font-semibold text-black">
          {initial}
        </span>
      </summary>

      <div className="absolute right-0 top-12 z-20 w-40 rounded-md border border-white/10 bg-[#080808] p-2 shadow-2xl shadow-black/60">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut aria-hidden="true" size={16} />
            Logout
          </button>
        </form>
      </div>
    </details>
  );
}
