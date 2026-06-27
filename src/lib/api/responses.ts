import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ErrorBody = {
  error: string;
  details?: string[];
};

export function errorResponse(
  message: string,
  status: number,
  details?: string[],
) {
  const body: ErrorBody = details ? { error: message, details } : { error: message };

  return NextResponse.json(body, { status });
}

export function validationErrorResponse(error: ZodError) {
  const details = error.issues.map((issue) => issue.message);

  return errorResponse("Input belum valid.", 400, details);
}

export async function readJsonBody(request: Request) {
  try {
    const data = (await request.json()) as unknown;

    return {
      ok: true,
      data,
    } as const;
  } catch {
    return {
      ok: false,
      response: errorResponse("Body request harus JSON valid.", 400),
    } as const;
  }
}
