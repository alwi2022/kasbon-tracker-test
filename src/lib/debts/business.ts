import type { DebtRow } from "@/types/database";

type SummaryDebt = Pick<DebtRow, "amount" | "settled_at" | "type">;

export type DebtSummary = {
  totalOwedToMe: number;
  totalIOwe: number;
  net: number;
};

export function calculateDebtSummary(debts: SummaryDebt[]): DebtSummary {
  return debts.reduce<DebtSummary>(
    (summary, debt) => {
      if (debt.settled_at) {
        return summary;
      }

      if (debt.type === "owed_to_me") {
        summary.totalOwedToMe += debt.amount;
      }

      if (debt.type === "i_owe") {
        summary.totalIOwe += debt.amount;
      }

      summary.net = summary.totalOwedToMe - summary.totalIOwe;

      return summary;
    },
    {
      totalOwedToMe: 0,
      totalIOwe: 0,
      net: 0,
    },
  );
}

export function getNetColorClass(net: number) {
  if (net > 0) {
    return "text-emerald-400";
  }

  if (net < 0) {
    return "text-red-400";
  }

  return "text-white";
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
});

export function formatRupiah(amount: number) {
  return rupiahFormatter.format(amount).replace(/\s/g, " ");
}

function parseDateInput(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatRelativeDateId(value: string | Date, now = new Date()) {
  const date = parseDateInput(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const today = startOfLocalDay(now);
  const targetDate = startOfLocalDay(date);
  const diffDays = Math.round(
    (today.getTime() - targetDate.getTime()) / oneDay,
  );

  if (diffDays === 0) {
    return "hari ini";
  }

  if (diffDays === 1) {
    return "kemarin";
  }

  if (diffDays > 1) {
    return `${diffDays} hari lalu`;
  }

  if (diffDays === -1) {
    return "besok";
  }

  return `${Math.abs(diffDays)} hari lagi`;
}

export function getDebtRelativeDate(
  debt: Pick<DebtRow, "created_at" | "due_date">,
) {
  return formatRelativeDateId(debt.due_date ?? debt.created_at);
}
