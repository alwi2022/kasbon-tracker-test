"use client";

import { CalendarDays, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDebtSchema, updateDebtSchema } from "@/lib/api/debt-schemas";
import type { DebtRow, DebtType } from "@/types/database";

type DebtFormModalProps =
  | {
      mode: "create";
      debt?: never;
    }
  | {
      mode: "edit";
      debt: DebtRow;
    };

type FormState = {
  type: DebtType;
  counterpart_name: string;
  amount: string;
  due_date: string;
  note: string;
};

type ApiError = {
  error?: string;
  details?: string[];
};

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

function getInitialState(debt?: DebtRow): FormState {
  return {
    type: debt?.type ?? "owed_to_me",
    counterpart_name: debt?.counterpart_name ?? "",
    amount: debt ? formatAmountInput(String(debt.amount)) : "",
    due_date: debt?.due_date ?? getTodayInputValue(),
    note: debt?.note ?? "",
  };
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;

    return body.details?.[0] ?? body.error ?? "Gagal menyimpan kasbon.";
  } catch {
    return "Gagal menyimpan kasbon.";
  }
}

export function DebtFormModal(props: DebtFormModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialState = getInitialState(
    props.mode === "edit" ? props.debt : undefined,
  );
  const [form, setForm] = useState<FormState>(initialState);

  const isEdit = props.mode === "edit";
  const title = isEdit ? "Edit kasbon" : "Catat baru";
  const Icon = isEdit ? Pencil : Plus;

  function openModal() {
    setForm(initialState);
    setError(null);
    setIsOpen(true);
  }

  function closeModal() {
    if (!isSaving && !isPending) {
      setIsOpen(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      type: form.type,
      counterpart_name: form.counterpart_name,
      amount: form.amount,
      due_date: form.due_date,
      note: form.note,
    };

    const parsedPayload = isEdit
      ? updateDebtSchema.safeParse(payload)
      : createDebtSchema.safeParse(payload);

    if (!parsedPayload.success) {
      setError(parsedPayload.error.issues[0]?.message ?? "Input belum valid.");
      return;
    }

    const endpoint = isEdit ? `/api/debts/${props.debt.id}` : "/api/debts";
    const method = isEdit ? "PATCH" : "POST";

    setIsSaving(true);
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedPayload.data),
    });
    setIsSaving(false);

    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }

    setIsOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          isEdit
            ? "inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
            : "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[linear-gradient(225deg,#fec07e_0%,#fe5501_48%,#d00307_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
        }
      >
        <Icon aria-hidden="true" size={16} />
        {title}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <section className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-lg border border-white/10 bg-[#080808] p-5 text-white shadow-2xl shadow-black/70 sm:max-w-lg">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving || isPending}
                className="rounded-md px-2 py-1 text-sm text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                Tutup
              </button>
            </div>

            {error ? (
              <p className="mb-4 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-white/80">Tipe</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="type"
                      value="owed_to_me"
                      checked={form.type === "owed_to_me"}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          type: "owed_to_me",
                        }))
                      }
                    />
                    Saya dihutang
                  </label>

                  <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="type"
                      value="i_owe"
                      checked={form.type === "i_owe"}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          type: "i_owe",
                        }))
                      }
                    />
                    Saya hutang
                  </label>
                </div>
              </fieldset>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">
                  Nama orang
                </span>
                <input
                  required
                  value={form.counterpart_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      counterpart_name: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ff8400]"
                  placeholder="Contoh: Budi"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">
                  Jumlah
                </span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: formatAmountInput(event.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ff8400]"
                  placeholder="25.000"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">
                  Tanggal
                </span>
                <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black px-3 transition focus-within:border-[#ff8400]">
                  <CalendarDays
                    aria-hidden="true"
                    className="text-white/45"
                    size={16}
                  />
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        due_date: event.target.value,
                      }))
                    }
                    className="h-full w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">
                  Catatan
                </span>
                <textarea
                  maxLength={200}
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  className="min-h-24 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ff8400]"
                  placeholder="Opsional"
                />
                <span className="block text-right text-xs text-white/40">
                  {form.note.length}/200
                </span>
              </label>

              <button
                type="submit"
                disabled={isSaving || isPending}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[linear-gradient(225deg,#fec07e_0%,#fe5501_48%,#d00307_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving || isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
