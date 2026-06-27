import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { calculateDebtSummary } from "@/lib/debts/business";
import {
  createDebtSchema,
  listDebtsQuerySchema,
} from "@/lib/api/debt-schemas";
import {
  errorResponse,
  readJsonBody,
  validationErrorResponse,
} from "@/lib/api/responses";
import type { DebtInsert } from "@/types/database";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedQuery = listDebtsQuerySchema.safeParse({
    search:
      request.nextUrl.searchParams.get("search") ??
      request.nextUrl.searchParams.get("q") ??
      undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    type: request.nextUrl.searchParams.get("type") ?? undefined,
    sort: request.nextUrl.searchParams.get("sort") ?? undefined,
  });

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error);
  }

  let query = auth.supabase
    .from("debts")
    .select("*")
    .eq("user_id", auth.user.id);

  if (parsedQuery.data.type !== "all") {
    query = query.eq("type", parsedQuery.data.type);
  }

  if (parsedQuery.data.search) {
    query = query.ilike("counterpart_name", `%${parsedQuery.data.search}%`);
  }

  if (parsedQuery.data.status === "unsettled") {
    query = query.is("settled_at", null);
  }

  if (parsedQuery.data.status === "settled") {
    query = query.not("settled_at", "is", null);
  }

  if (parsedQuery.data.sort === "date_asc") {
    query = query
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
  }

  if (parsedQuery.data.sort === "date_desc") {
    query = query
      .order("due_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  if (parsedQuery.data.sort === "amount_asc") {
    query = query
      .order("amount", { ascending: true })
      .order("created_at", { ascending: false });
  }

  if (parsedQuery.data.sort === "amount_desc") {
    query = query
      .order("amount", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse("Gagal mengambil data kasbon.", 500);
  }

  const { data: summaryRows, error: summaryError } = await auth.supabase
    .from("debts")
    .select("type, amount, settled_at")
    .eq("user_id", auth.user.id);

  if (summaryError) {
    return errorResponse("Gagal menghitung ringkasan kasbon.", 500);
  }

  const summary = calculateDebtSummary(summaryRows);

  return NextResponse.json({ data, summary });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsedBody = createDebtSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  const debt: DebtInsert = {
    user_id: auth.user.id,
    type: parsedBody.data.type,
    counterpart_name: parsedBody.data.counterpart_name,
    amount: parsedBody.data.amount,
    due_date: parsedBody.data.due_date ?? null,
    note: parsedBody.data.note ?? null,
    settled_at: null,
  };

  const { data, error } = await auth.supabase
    .from("debts")
    .insert(debt)
    .select("*")
    .single();

  if (error) {
    return errorResponse("Gagal menyimpan data kasbon.", 500);
  }

  return NextResponse.json({ data }, { status: 201 });
}
