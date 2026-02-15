import { z } from "zod";
import i18n from "@/lib/i18n";

const t = (key: string) => i18n.t(key as any, { ns: "validation" });

const nameField = () =>
  z.string().min(1, t("nameRequired")).max(255, t("nameTooLong"));

export const createAssetSchema = () =>
  z.object({
    name: nameField(),
    type: z.enum(["stock", "crypto", "real_estate", "cash", "other"]),
    symbol: z.string().max(20).nullable().optional(),
    quantity: z.number().min(0, t("quantityMin")),
    manualPrice: z.number().min(0, t("priceMin")).nullable().optional(),
    currency: z.string().length(3, t("currencyCode")),
  });

export const createAccountSchema = () =>
  z.object({
    name: nameField(),
    balance: z.number().min(0, t("balanceMin")),
    currency: z.string().length(3, t("currencyCode")),
    countryCode: z
      .string()
      .length(2, t("countryCodeLength"))
      .regex(/^[A-Z]{2}$/, t("countryCodeFormat")),
  });

export const createEntitySchema = () =>
  z.object({
    name: nameField(),
  });

export const createCashFlowSchema = () =>
  z
    .object({
      name: nameField(),
      amount: z.number().positive(t("amountPositive")),
      flowType: z.enum(["inflow", "outflow"]),
      frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
      category: z.string().min(1, t("categoryRequired")),
      startDate: z.string().min(1, t("startDateRequired")),
      endDate: z.string().nullable().optional(),
    })
    .refine((data) => !data.endDate || data.endDate >= data.startDate, {
      message: t("endDateAfterStart"),
      path: ["endDate"],
    });

export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  return {
    success: false,
    error: firstIssue?.message ?? t("validationFailed"),
  };
}
