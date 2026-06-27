"use client";

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
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        className="rounded-md border border-[#ff8400]/30 px-3 py-2 text-sm font-medium text-[#ffb36c] transition hover:bg-[#ff8400]/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSettled ? "Batalkan lunas" : "Tandai lunas"}
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
