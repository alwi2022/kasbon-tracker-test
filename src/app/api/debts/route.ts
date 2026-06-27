import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
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
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    type: request.nextUrl.searchParams.get("type") ?? undefined,
  });

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error);
  }

  let query = auth.supabase
    .from("debts")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (parsedQuery.data.type !== "all") {
    query = query.eq("type", parsedQuery.data.type);
  }

  if (parsedQuery.data.status === "unsettled") {
    query = query.is("settled_at", null);
  }

  if (parsedQuery.data.status === "settled") {
    query = query.not("settled_at", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse("Gagal mengambil data kasbon.", 500);
  }

  return NextResponse.json({ data });
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
