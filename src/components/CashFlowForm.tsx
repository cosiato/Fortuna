import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type {
  CashFlow,
  CashFlowType,
  CashFlowFrequency,
  CashFlowCategory,
  CreateCashFlowInput,
  UpdateCashFlowInput,
} from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCategoriesByType } from "@/lib/cashFlowCategories"
import { createCashFlowSchema, validateSchema } from "@/lib/validation"
import { toast } from "sonner"

interface CashFlowFormProps {
  cashFlow?: CashFlow | null
  accountId: string
  accountCurrency?: string
  defaultFlowType?: CashFlowType
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateCashFlowInput | UpdateCashFlowInput, isEdit: boolean) => void
}

export default function CashFlowForm({
  cashFlow,
  accountId,
  accountCurrency,
  defaultFlowType,
  open,
  onOpenChange,
  onSubmit,
}: CashFlowFormProps) {
  const { t } = useTranslation(["vaults", "common"])
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [flowType, setFlowType] = useState<CashFlowType>("inflow")
  const [frequency, setFrequency] = useState<CashFlowFrequency>("monthly")
  const [category, setCategory] = useState<CashFlowCategory>("salary")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (cashFlow) {
      setName(cashFlow.name)
      setAmount(cashFlow.amount.toString())
      setFlowType(cashFlow.flowType)
      setFrequency(cashFlow.frequency)
      setCategory(cashFlow.category)
      setStartDate(cashFlow.startDate)
      setEndDate(cashFlow.endDate ?? "")
    } else {
      const initialType = defaultFlowType ?? "inflow"
      setName("")
      setAmount("")
      setFlowType(initialType)
      setFrequency("monthly")
      setCategory(getCategoriesByType(initialType)[0]?.key ?? "salary")
      setStartDate(new Date().toISOString().split("T")[0])
      setEndDate("")
    }
  }, [cashFlow, open, defaultFlowType])

  const isEditing = !!cashFlow
  const categories = getCategoriesByType(flowType)

  useEffect(() => {
    const validKeys = categories.map((c) => c.key)
    if (!validKeys.includes(category)) {
      setCategory(categories[0]?.key ?? "salary")
    }
  }, [flowType, categories, category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)

    const validation = validateSchema(createCashFlowSchema(), {
      name: name.trim(),
      amount: isNaN(parsedAmount) ? 0 : parsedAmount,
      flowType,
      frequency,
      category,
      startDate,
      endDate: endDate || null,
    })
    if (!validation.success) {
      toast.error(validation.error)
      return
    }

    if (isEditing) {
      const updateData: UpdateCashFlowInput = {
        name,
        amount: parsedAmount,
        flowType,
        frequency,
        category,
        startDate,
        endDate: endDate || null,
      }
      onSubmit(updateData, true)
    } else {
      const createData: CreateCashFlowInput = {
        accountId,
        name,
        amount: parsedAmount,
        flowType,
        frequency,
        category,
        startDate,
        endDate: endDate || null,
      }
      onSubmit(createData, false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("vaults:cashFlow.editTitle") : t("vaults:cashFlow.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cf-name">{t("common:name")}</Label>
            <Input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("vaults:cashFlow.namePlaceholder")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cf-amount">{t("vaults:cashFlow.amount")}</Label>
              <div className="relative">
                <Input
                  id="cf-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  className={accountCurrency ? "pr-14" : ""}
                  required
                />
                {accountCurrency && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground select-none">
                    {accountCurrency}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf-frequency">{t("vaults:cashFlow.frequency")}</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as CashFlowFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("common:frequency.daily")}</SelectItem>
                  <SelectItem value="weekly">{t("common:frequency.weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("common:frequency.monthly")}</SelectItem>
                  <SelectItem value="yearly">{t("common:frequency.yearly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cf-flow-type">{t("vaults:cashFlow.type")}</Label>
              <Select value={flowType} onValueChange={(v) => setFlowType(v as CashFlowType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inflow">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {t("common:flowType.inflow")}
                    </span>
                  </SelectItem>
                  <SelectItem value="outflow">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {t("common:flowType.outflow")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf-category">{t("vaults:cashFlow.category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CashFlowCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cf-start-date">{t("vaults:cashFlow.startDate")}</Label>
              <Input
                id="cf-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf-end-date">{t("vaults:cashFlow.endDate")}</Label>
              <Input
                id="cf-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("common:cancel")}
            </Button>
            <Button type="submit" variant="default" className="flex-1">
              {isEditing ? t("common:update") : t("vaults:cashFlow.addBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
