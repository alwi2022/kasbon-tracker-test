"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { formatRupiah } from "@/lib/debts/business";

type DeleteDebtButtonProps = {
  debtId: string;
  counterpartName: string;
  amount: number;
};

type ApiError = {
  error?: string;
};

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;

    return body.error ?? "Catatan belum bisa dihapus. Coba lagi sebentar.";
  } catch {
    return "Catatan belum bisa dihapus. Coba lagi sebentar.";
  }
}

export function DeleteDebtButton({
  debtId,
  counterpartName,
  amount,
}: DeleteDebtButtonProps) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isDeleting || isPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, isOpen]);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    const response = await fetch(`/api/debts/${debtId}`, {
      method: "DELETE",
    });
    setIsDeleting(false);

    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }

    setIsOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  function closeModal() {
    if (!isBusy) {
      setIsOpen(false);
    }
  }

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-400/25 px-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Trash2 aria-hidden="true" size={15} />
        Hapus
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/80 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            role="dialog"
            className="relative w-full rounded-lg border border-white/10 bg-[#080808] p-5 text-white shadow-2xl shadow-black/70 sm:max-w-sm"
          >
            <button
              type="button"
              aria-label="Tutup popup"
              disabled={isBusy}
              onClick={closeModal}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X aria-hidden="true" size={16} />
            </button>

            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-200">
              <AlertTriangle aria-hidden="true" size={21} />
            </div>

            <div className="mt-4 text-center">
              <h2 id={titleId} className="text-lg font-semibold">
                Hapus catatan?
              </h2>
              <p
                id={descriptionId}
                className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-white/55"
              >
                {counterpartName} senilai {formatRupiah(amount)} akan dihapus
                permanen.
              </p>
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                disabled={isBusy}
                onClick={closeModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleDelete}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 aria-hidden="true" size={16} />
                {isBusy ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
