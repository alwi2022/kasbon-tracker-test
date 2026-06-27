"use client";

import { RotateCcw } from "lucide-react";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <section className="rounded-lg border border-red-400/25 bg-red-500/10 p-6">
      <h1 className="text-lg font-semibold text-red-100">
        Data kasbon gagal dimuat.
      </h1>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-red-300/30 px-3 text-sm font-medium text-red-100 transition hover:bg-red-500/10"
      >
        <RotateCcw aria-hidden="true" size={16} />
        Coba lagi
      </button>
    </section>
  );
}
