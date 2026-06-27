import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Search,
  Scale,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteDebtButton } from "@/components/debts/delete-debt-button";
import { DebtFormModal } from "@/components/debts/debt-form-modal";
import { SettledToggleButton } from "@/components/debts/settled-toggle-button";
import {
  listDebtsQuerySchema,
  type DebtSortOption,
  type DebtStatusFilter,
  type DebtTypeFilter,
} from "@/lib/api/debt-schemas";
import {
  calculateDebtSummary,
  formatRupiah,
  getDebtRelativeDate,
  getNetColorClass,
} from "@/lib/debts/business";
import { createClient } from "@/lib/supabase/server";
import type { DebtRow, DebtType } from "@/types/database";

type AppPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
};

type MetricCard = {
  title: string;
  value: number;
  helper: string;
  valueClassName: string;
  icon: LucideIcon;
};

type PersonBalance = {
  name: string;
  balance: number;
  count: number;
};

type DashboardFilters = {
  search?: string;
  status: DebtStatusFilter;
  type: DebtTypeFilter;
  sort: DebtSortOption;
};

const PAGE_SIZE = 5;
const PEOPLE_LIMIT = 10;

const typeLabels: Record<DebtType, string> = {
  owed_to_me: "Piutang",
  i_owe: "Utang",
};

const typeBadgeClassNames: Record<DebtType, string> = {
  owed_to_me: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  i_owe: "border-orange-400/20 bg-orange-400/10 text-orange-200",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPageParam(value: string | undefined) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function getDisplayName(email: string | undefined) {
  const name = email?.split("@")[0]?.trim();

  if (!name) {
    return "Admin";
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getGreeting() {
  const jakartaHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );

  if (jakartaHour < 12) {
    return "Selamat pagi";
  }

  if (jakartaHour < 18) {
    return "Selamat siang";
  }

  return "Selamat malam";
}

function getStatusLabel(debt: DebtRow) {
  return debt.settled_at ? "Lunas" : "Belum lunas";
}

function getStatusClassName(debt: DebtRow) {
  return debt.settled_at
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
    : "border-white/10 bg-white/[0.03] text-white/55";
}

function getSortOrder(sort: string) {
  if (sort === "date_asc") {
    return [{ column: "due_date", ascending: true }] as const;
  }

  if (sort === "amount_desc") {
    return [{ column: "amount", ascending: false }] as const;
  }

  if (sort === "amount_asc") {
    return [{ column: "amount", ascending: true }] as const;
  }

  return [{ column: "due_date", ascending: false }] as const;
}

function buildPeopleBalances(debts: DebtRow[]) {
  const balances = new Map<string, PersonBalance>();

  for (const debt of debts) {
    if (debt.settled_at) {
      continue;
    }

    const key = debt.counterpart_name.trim().toLowerCase();
    const current = balances.get(key) ?? {
      name: debt.counterpart_name,
      balance: 0,
      count: 0,
    };

    current.balance += debt.type === "owed_to_me" ? debt.amount : -debt.amount;
    current.count += 1;
    balances.set(key, current);
  }

  return Array.from(balances.values())
    .filter((person) => person.balance !== 0)
    .sort((first, second) => Math.abs(second.balance) - Math.abs(first.balance));
}

function getActivityText(debt: DebtRow) {
  const amount = formatRupiah(debt.amount);

  if (debt.settled_at && debt.type === "owed_to_me") {
    return `${debt.counterpart_name} membayar ${amount}`;
  }

  if (debt.settled_at && debt.type === "i_owe") {
    return `Kamu membayar ${amount} ke ${debt.counterpart_name}`;
  }

  if (debt.type === "owed_to_me") {
    return `${debt.counterpart_name} meminjam ${amount}`;
  }

  return `Kamu meminjam ${amount} dari ${debt.counterpart_name}`;
}

function MetricCardItem({ card }: { card: MetricCard }) {
  const Icon = card.icon;

  return (
    <article className="rounded-lg border border-white/10 bg-[#080808] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/45">{card.title}</p>
          <p
            className={`mt-3 break-words text-2xl font-semibold tracking-tight ${card.valueClassName}`}
          >
            {formatRupiah(card.value)}
          </p>
          <p className="mt-2 text-xs text-white/35">{card.helper}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/45">
          <Icon aria-hidden="true" size={17} />
        </span>
      </div>
    </article>
  );
}

function FilterBar({
  search,
  status,
  type,
  sort,
}: {
  search: string;
  status: string;
  type: string;
  sort: string;
}) {
  return (
    <form
      action="/"
      className="grid gap-2 rounded-lg border border-white/10 bg-[#080808] p-3 sm:grid-cols-2"
    >
      <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-white/10 bg-black px-3 sm:col-span-2">
        <Search aria-hidden="true" className="text-white/35" size={15} />
        <input
          name="search"
          defaultValue={search}
          placeholder="Cari nama orang"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
        />
      </label>

      <select
        name="status"
        defaultValue={status}
        className="h-10 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none"
      >
        <option value="all">Semua status</option>
        <option value="unsettled">Belum lunas</option>
        <option value="settled">Lunas</option>
      </select>

      <select
        name="type"
        defaultValue={type}
        className="h-10 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none"
      >
        <option value="all">Semua tipe</option>
        <option value="owed_to_me">Piutang</option>
        <option value="i_owe">Utang</option>
      </select>

      <select
        name="sort"
        defaultValue={sort}
        className="h-10 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none"
      >
        <option value="date_desc">Tanggal terbaru</option>
        <option value="date_asc">Tanggal terlama</option>
        <option value="amount_desc">Jumlah terbesar</option>
        <option value="amount_asc">Jumlah terkecil</option>
      </select>

      <button
        type="submit"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
      >
        <Filter aria-hidden="true" size={15} />
        Terapkan
      </button>
    </form>
  );
}

function buildDashboardHref(filters: DashboardFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.type !== "all") {
    params.set("type", filters.type);
  }

  if (filters.sort !== "date_desc") {
    params.set("sort", filters.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `/?${queryString}` : "/";
}

function PaginationControls({
  filters,
  page,
  totalCount,
  totalPages,
}: {
  filters: DashboardFilters;
  page: number;
  totalCount: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#080808] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-white/40">{totalCount} catatan</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildDashboardHref(filters, page - 1)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
          >
            Sebelumnya
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center justify-center rounded-md border border-white/5 px-3 text-sm text-white/25">
            Sebelumnya
          </span>
        )}

        <span className="px-2 text-center text-sm text-white/45">
          {page}/{totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={buildDashboardHref(filters, page + 1)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
          >
            Berikutnya
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center justify-center rounded-md border border-white/5 px-3 text-sm text-white/25">
            Berikutnya
          </span>
        )}
      </div>
    </nav>
  );
}

function CashFlowPanel({
  owedToMe,
  iOwe,
}: {
  owedToMe: number;
  iOwe: number;
}) {
  const maxValue = Math.max(owedToMe, iOwe, 1);
  const receivableHeight = `${Math.max((owedToMe / maxValue) * 100, 8)}%`;
  const payableHeight = `${Math.max((iOwe / maxValue) * 100, 8)}%`;

  return (
    <section className="rounded-lg border border-white/10 bg-[#080808] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Arus Kas</h2>
          <p className="mt-1 text-sm text-white/40">Piutang vs utang terbuka</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
          Saat ini
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="flex h-52 items-end gap-4 rounded-lg border border-white/10 bg-black px-5 py-4">
          <div className="flex h-full flex-1 flex-col justify-end gap-3">
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-emerald-400"
                style={{ height: receivableHeight }}
              />
            </div>
            <div>
              <p className="text-xs text-white/40">Piutang</p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                {formatRupiah(owedToMe)}
              </p>
            </div>
          </div>

          <div className="flex h-full flex-1 flex-col justify-end gap-3">
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-orange-500"
                style={{ height: payableHeight }}
              />
            </div>
            <div>
              <p className="text-xs text-white/40">Utang</p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                {formatRupiah(iOwe)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-white/10 bg-black p-4">
            <p className="text-xs text-white/40">Masuk</p>
            <p className="mt-2 text-lg font-semibold text-emerald-300">
              {formatRupiah(owedToMe)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black p-4">
            <p className="text-xs text-white/40">Keluar</p>
            <p className="mt-2 text-lg font-semibold text-orange-300">
              {formatRupiah(iOwe)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentActivity({ debts }: { debts: DebtRow[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#080808] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight">
          Aktivitas Terbaru
        </h2>
        <Clock3 aria-hidden="true" className="text-white/35" size={17} />
      </div>

      <div className="mt-5 space-y-4">
        {debts.length > 0 ? (
          debts.slice(0, 4).map((debt) => {
            const Icon = debt.settled_at ? CheckCircle2 : Circle;

            return (
              <div key={debt.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    debt.settled_at
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.03] text-white/45"
                  }`}
                >
                  <Icon aria-hidden="true" size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/90">
                    {getActivityText(debt)}
                  </p>
                  <p className="mt-1 text-xs text-white/35">
                    {getDebtRelativeDate(debt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-white/40">Belum ada aktivitas.</p>
        )}
      </div>
    </section>
  );
}

function PeoplePanel({
  people,
  totalPeople,
}: {
  people: PersonBalance[];
  totalPeople: number;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#080808] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Orang</h2>
          <p className="mt-1 text-sm text-white/40">Saldo terbuka per orang</p>
        </div>
        <span className="text-xs text-white/35">
          {totalPeople > people.length
            ? `${people.length} teratas dari ${totalPeople}`
            : `${totalPeople} orang`}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {people.length > 0 ? (
          people.map((person) => {
            const isReceivable = person.balance > 0;

            return (
              <div
                key={person.name}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      isReceivable ? "bg-emerald-400" : "bg-orange-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {person.name}
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      {person.count} catatan aktif
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-semibold ${
                      isReceivable ? "text-emerald-300" : "text-orange-300"
                    }`}
                  >
                    {isReceivable ? "" : "-"}
                    {formatRupiah(Math.abs(person.balance))}
                  </p>
                  <p className="mt-1 text-xs text-white/35">
                    {isReceivable ? "Piutang" : "Utang"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-8 text-center text-sm text-white/40">
            Tidak ada saldo terbuka.
          </p>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-white/15 bg-[#080808] px-6 py-12 text-center">
      <CalendarDays className="mx-auto text-white/40" size={30} />
      <h2 className="mt-4 text-base font-semibold">Belum ada catatan kasbon</h2>
      <p className="mt-2 text-sm text-white/40">
        Catatan baru akan muncul di sini setelah kamu simpan.
      </p>
      <div className="mt-5">
        <DebtFormModal mode="create" />
      </div>
    </section>
  );
}

function DebtCard({ debt }: { debt: DebtRow }) {
  const amountClassName =
    debt.type === "owed_to_me" ? "text-emerald-300" : "text-orange-300";

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#080808] p-4 transition hover:border-white/15">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                {debt.counterpart_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">
                  {debt.counterpart_name}
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  {getDebtRelativeDate(debt)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-1 text-xs font-medium ${typeBadgeClassNames[debt.type]}`}
              >
                {typeLabels[debt.type]}
              </span>
              <span
                className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClassName(debt)}`}
              >
                {getStatusLabel(debt)}
              </span>
            </div>
          </div>

          {debt.note ? (
            <p className="text-sm leading-6 text-white/50">{debt.note}</p>
          ) : null}
        </div>

        <div className="min-w-0 shrink-0 space-y-3 lg:text-right">
          <p
            className={`break-words text-xl font-semibold tracking-tight sm:text-2xl ${amountClassName}`}
          >
            {formatRupiah(debt.amount)}
          </p>
          <div className="grid gap-2 sm:flex sm:flex-wrap lg:justify-end">
            <SettledToggleButton
              debtId={debt.id}
              isSettled={Boolean(debt.settled_at)}
            />
            <DebtFormModal mode="edit" debt={debt} />
            <DeleteDebtButton
              debtId={debt.id}
              counterpartName={debt.counterpart_name}
              amount={debt.amount}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = await searchParams;
  const parsedFilters = listDebtsQuerySchema.safeParse({
    search: getParam(params.search),
    status: getParam(params.status),
    type: getParam(params.type),
    sort: getParam(params.sort),
  });

  const filters = parsedFilters.success
    ? parsedFilters.data
    : {
        search: undefined,
        status: "all" as const,
        type: "all" as const,
        sort: "date_desc" as const,
      };
  const currentPage = getPageParam(getParam(params.page));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: overviewRows, error: overviewError } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (overviewError) {
    throw new Error("Gagal mengambil ringkasan kasbon.");
  }

  let query = supabase
    .from("debts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (filters.status === "unsettled") {
    query = query.is("settled_at", null);
  }

  if (filters.status === "settled") {
    query = query.not("settled_at", "is", null);
  }

  if (filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.search) {
    query = query.ilike("counterpart_name", `%${filters.search}%`);
  }

  for (const order of getSortOrder(filters.sort)) {
    query = query.order(order.column, {
      ascending: order.ascending,
      nullsFirst: false,
    });
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: debts, error: debtsError, count } = await query;

  if (debtsError) {
    throw new Error("Gagal mengambil data kasbon.");
  }

  const overviewDebts = overviewRows ?? [];
  const filteredDebts = debts ?? [];
  const filteredCount = count ?? filteredDebts.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  if (currentPage > totalPages && filteredCount > 0) {
    redirect(buildDashboardHref(filters, totalPages));
  }

  const visibleStart = filteredCount === 0 ? 0 : from + 1;
  const visibleEnd = Math.min(from + filteredDebts.length, filteredCount);
  const summary = calculateDebtSummary(overviewDebts);
  const peopleBalances = buildPeopleBalances(overviewDebts);
  const people = peopleBalances.slice(0, PEOPLE_LIMIT);
  const displayName = getDisplayName(user.email);
  const metricCards: MetricCard[] = [
    {
      title: "Total Piutang",
      value: summary.totalOwedToMe,
      helper: "Uang yang dipinjam orang",
      valueClassName: "text-emerald-300",
      icon: ArrowDownLeft,
    },
    {
      title: "Total Utang",
      value: summary.totalIOwe,
      helper: "Uang yang kamu pinjam",
      valueClassName: "text-orange-300",
      icon: ArrowUpRight,
    },
    {
      title: "Saldo Bersih",
      value: summary.net,
      helper: "Piutang dikurangi utang",
      valueClassName: getNetColorClass(summary.net),
      icon: Scale,
    },
  ];

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/55">
            {getGreeting()}, {displayName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Dashboard Kasbon
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {overviewDebts.length} total catatan, {filteredCount} sesuai filter
          </p>
        </div>
        <DebtFormModal mode="create" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {metricCards.map((card) => (
          <MetricCardItem key={card.title} card={card} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)]">
        <CashFlowPanel
          owedToMe={summary.totalOwedToMe}
          iOwe={summary.totalIOwe}
        />
        <RecentActivity debts={overviewDebts} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <PeoplePanel people={people} totalPeople={peopleBalances.length} />

        <section className="min-w-0 space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Semua Catatan
              </h2>
              <p className="mt-1 text-sm text-white/40">
                {visibleStart}-{visibleEnd} dari {filteredCount} catatan
              </p>
            </div>
          </div>

          <FilterBar
            search={filters.search ?? ""}
            status={filters.status}
            type={filters.type}
            sort={filters.sort}
          />

          {filteredDebts.length > 0 ? (
            <div className="space-y-3">
              {filteredDebts.map((debt) => (
                <DebtCard key={debt.id} debt={debt} />
              ))}
              <PaginationControls
                filters={filters}
                page={currentPage}
                totalCount={filteredCount}
                totalPages={totalPages}
              />
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </section>
  );
}
