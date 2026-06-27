import { z } from "zod";
import type { DebtType } from "@/types/database";

export type DebtStatusFilter = "all" | "unsettled" | "settled";
export type DebtTypeFilter = "all" | DebtType;
export type DebtSortOption =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc";

const statusQueryValues = [
  "all",
  "semua",
  "unsettled",
  "belum",
  "settled",
  "lunas",
] as const;

const typeQueryValues = [
  "all",
  "semua",
  "owed_to_me",
  "i_owe",
  "dihutang",
  "hutang",
] as const;

const sortQueryValues = [
  "date_desc",
  "date_asc",
  "amount_desc",
  "amount_asc",
] as const;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function emptyStringToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

function emptyStringToNull(value: unknown) {
  return value === "" ? null : value;
}

function isValidDateString(value: string) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().startsWith(value);
}

function normalizeStatus(value: (typeof statusQueryValues)[number]) {
  if (value === "belum" || value === "unsettled") {
    return "unsettled";
  }

  if (value === "lunas" || value === "settled") {
    return "settled";
  }

  return "all";
}

function normalizeType(value: (typeof typeQueryValues)[number]) {
  if (value === "dihutang") {
    return "owed_to_me";
  }

  if (value === "hutang") {
    return "i_owe";
  }

  if (value === "owed_to_me" || value === "i_owe") {
    return value;
  }

  return "all";
}

const debtTypeSchema = z.enum(["owed_to_me", "i_owe"], {
  error: "Tipe kasbon harus owed_to_me atau i_owe.",
});

function normalizeAmountInput(value: unknown) {
  if (typeof value === "string") {
    return value.replace(/\./g, "");
  }

  return value;
}

const amountSchema = z
  .preprocess(
    normalizeAmountInput,
    z.coerce
      .number({ error: "Jumlah wajib berupa angka." })
      .int("Jumlah harus angka Rupiah utuh.")
      .positive("Jumlah harus lebih dari 0.")
      .max(Number.MAX_SAFE_INTEGER, "Jumlah terlalu besar."),
  );

const requiredNameSchema = z
  .string({ error: "Nama orang wajib diisi." })
  .trim()
  .min(1, "Nama orang wajib diisi.");

const noteSchema = z
  .union([z.string().max(200, "Catatan maksimal 200 karakter."), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmedNote = value.trim();

    return trimmedNote.length > 0 ? trimmedNote : null;
  });

const dateSchema = z
  .preprocess(
    emptyStringToNull,
    z
      .union([
        z
          .string()
          .regex(dateRegex, "Tanggal harus format YYYY-MM-DD.")
          .refine(isValidDateString, "Tanggal tidak valid."),
        z.null(),
      ])
      .optional(),
  )
  .transform((value) => value);

const settledAtSchema = z
  .preprocess(
    emptyStringToNull,
    z
      .union([z.string().datetime("Tanggal lunas harus format ISO."), z.null()])
      .optional(),
  )
  .transform((value) => value);

export const listDebtsQuerySchema = z
  .object({
    search: z
      .preprocess(
        emptyStringToUndefined,
        z.string().trim().max(80, "Pencarian maksimal 80 karakter.").optional(),
      )
      .transform((value) => value || undefined),
    status: z
      .preprocess(
        emptyStringToUndefined,
        z.enum(statusQueryValues, {
          error: "Filter status tidak valid.",
        }).default("all"),
      )
      .transform(normalizeStatus),
    type: z
      .preprocess(
        emptyStringToUndefined,
        z.enum(typeQueryValues, {
          error: "Filter tipe tidak valid.",
        }).default("all"),
      )
      .transform(normalizeType),
    sort: z
      .preprocess(
        emptyStringToUndefined,
        z.enum(sortQueryValues, {
          error: "Urutan data tidak valid.",
        }).default("date_desc"),
      ),
  })
  .strict();

export const createDebtSchema = z
  .object({
    type: debtTypeSchema,
    counterpart_name: requiredNameSchema,
    amount: amountSchema,
    due_date: dateSchema,
    note: noteSchema,
  })
  .strict();

export const updateDebtSchema = z
  .object({
    type: debtTypeSchema.optional(),
    counterpart_name: requiredNameSchema.optional(),
    amount: amountSchema.optional(),
    due_date: dateSchema,
    note: noteSchema,
    settled: z
      .boolean({ error: "Status lunas harus true atau false." })
      .optional(),
    settled_at: settledAtSchema,
  })
  .strict()
  .refine(
    (value) =>
      Object.values(value).some((fieldValue) => fieldValue !== undefined),
    "Minimal satu field perlu dikirim.",
  );

export const debtIdSchema = z.uuid("ID kasbon tidak valid.");
