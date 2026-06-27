"use client";

import { CheckCircle2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SettledToggleButtonProps = {
  debtId: string;
  isSettled: boolean;
};

type ApiError = {
  error?: string;
};

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;

    return body.error ?? "Gagal mengubah status kasbon.";
  } catch {
    return "Gagal mengubah status kasbon.";
  }
}

export function SettledToggleButton({
  debtId,
  isSettled,
}: SettledToggleButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const Icon = isSettled ? Undo2 : CheckCircle2;

  async function handleToggle() {
    setError(null);

    const response = await fetch(`/api/debts/${debtId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        settled: !isSettled,
      }),
    });

    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Icon aria-hidden="true" size={15} />
        {isSettled ? "Batalkan lunas" : "Tandai lunas"}
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
