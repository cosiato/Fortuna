import { z } from "zod"

const nameField = z.string().min(1, "Name is required").max(255, "Name is too long (max 255)")

export const assetSchema = z.object({
  name: nameField,
  type: z.enum(["stock", "crypto", "real_estate", "cash", "other"]),
  symbol: z.string().max(20).nullable().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  manualPrice: z.number().min(0, "Price must be 0 or greater").nullable().optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
})

export const accountSchema = z.object({
  name: nameField,
  balance: z.number().min(0, "Balance must be 0 or greater"),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  countryCode: z
    .string()
    .length(2, "Country code must be a 2-letter code")
    .regex(/^[A-Z]{2}$/, "Country code must be uppercase letters"),
})

export const entitySchema = z.object({
  name: nameField,
})

export const cashFlowSchema = z
  .object({
    name: nameField,
    amount: z.number().positive("Amount must be greater than 0"),
    flowType: z.enum(["inflow", "outflow"]),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    category: z.string().min(1, "Category is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().nullable().optional(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    { message: "End date must be after start date", path: ["endDate"] },
  )

export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstIssue = result.error.issues[0]
  return { success: false, error: firstIssue?.message ?? "Validation failed" }
}
