import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { debtIdSchema, updateDebtSchema } from "@/lib/api/debt-schemas";
import {
  errorResponse,
  readJsonBody,
  validationErrorResponse,
} from "@/lib/api/responses";
import type { DebtUpdate } from "@/types/database";

type DebtRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isNoRowsError(error: { code?: string }) {
  return error.code === "PGRST116";
}

export async function PATCH(request: NextRequest, context: DebtRouteContext) {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsedId = debtIdSchema.safeParse(id);

  if (!parsedId.success) {
    return validationErrorResponse(parsedId.error);
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsedBody = updateDebtSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  const updatePayload: DebtUpdate = {};

  if (parsedBody.data.type !== undefined) {
    updatePayload.type = parsedBody.data.type;
  }

  if (parsedBody.data.counterpart_name !== undefined) {
    updatePayload.counterpart_name = parsedBody.data.counterpart_name;
  }

  if (parsedBody.data.amount !== undefined) {
    updatePayload.amount = parsedBody.data.amount;
  }

  if (parsedBody.data.due_date !== undefined) {
    updatePayload.due_date = parsedBody.data.due_date;
  }

  if (parsedBody.data.note !== undefined) {
    updatePayload.note = parsedBody.data.note;
  }

  if (parsedBody.data.settled !== undefined) {
    updatePayload.settled_at = parsedBody.data.settled
      ? new Date().toISOString()
      : null;
  } else if (parsedBody.data.settled_at !== undefined) {
    updatePayload.settled_at = parsedBody.data.settled_at;
  }

  const { data, error } = await auth.supabase
    .from("debts")
    .update(updatePayload)
    .eq("id", parsedId.data)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      return errorResponse("Data kasbon tidak ditemukan.", 404);
    }

    return errorResponse("Gagal mengubah data kasbon.", 500);
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, context: DebtRouteContext) {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsedId = debtIdSchema.safeParse(id);

  if (!parsedId.success) {
    return validationErrorResponse(parsedId.error);
  }

  const { error } = await auth.supabase
    .from("debts")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", auth.user.id)
    .select("id")
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      return errorResponse("Data kasbon tidak ditemukan.", 404);
    }

    return errorResponse("Gagal menghapus data kasbon.", 500);
  }

  return NextResponse.json({ message: "Data kasbon berhasil dihapus." });
}
