import { useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  Asset,
  Account,
  CashFlow,
  CreateCashFlowInput,
  UpdateCashFlowInput,
} from "@/types/database"
import { api } from "@/lib/api"
import { showErrorToast } from "@/lib/errorHandling"

interface UseVaultCrudOptions {
  selectedEntityId: number
  cashFlows: CashFlow[]
  setCashFlows: React.Dispatch<React.SetStateAction<CashFlow[]>>
  fetchDataOnly: () => Promise<{ assetsData: Asset[]; accountsData: Account[] }>
  requestSnapshot: () => void
}

export function useVaultCrud({
  selectedEntityId,
  cashFlows,
  setCashFlows,
  fetchDataOnly,
  requestSnapshot,
}: UseVaultCrudOptions) {
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [cashFlowFormOpen, setCashFlowFormOpen] = useState(false)
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlow | null>(null)
  const [cashFlowAccountId, setCashFlowAccountId] = useState<string>("")
  const [defaultFlowType, setDefaultFlowType] = useState<"inflow" | "outflow" | undefined>(
    undefined,
  )

  const { t } = useTranslation(["errors"])

  const handleAddAccount = async (data: Partial<Account>) => {
    try {
      await api.accounts.create({
        name: data.name!,
        balance: data.balance,
        currency: data.currency,
        countryCode: data.countryCode!,
        entityId: selectedEntityId,
      })
      setAccountFormOpen(false)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, t("errors:failedToCreateVault"))
    }
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setAccountFormOpen(true)
  }

  const handleUpdateAccount = async (data: Partial<Account>) => {
    if (!editingAccount) return
    try {
      await api.accounts.update(editingAccount.id, {
        name: data.name,
        balance: data.balance,
        currency: data.currency,
        countryCode: data.countryCode,
      })
      setAccountFormOpen(false)
      setEditingAccount(null)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, t("errors:failedToUpdateVault"))
    }
  }

  const handleAccountFormClose = (open: boolean) => {
    setAccountFormOpen(open)
    if (!open) {
      setEditingAccount(null)
    }
  }

  const handleDeleteAccountRequest = (account: Account) => {
    setAccountToDelete(account)
    setDeleteAccountDialogOpen(true)
  }

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return
    try {
      await api.accounts.delete(accountToDelete.id)
      setDeleteAccountDialogOpen(false)
      setAccountToDelete(null)
      await fetchDataOnly()
      requestSnapshot()
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, t("errors:failedToDeleteVault"))
    }
  }

  const handleAddCashFlow = async (
    data: CreateCashFlowInput | UpdateCashFlowInput,
    isEdit: boolean,
  ) => {
    try {
      if (isEdit && editingCashFlow) {
        await api.cashFlows.update(editingCashFlow.id, data as UpdateCashFlowInput)
      } else {
        await api.cashFlows.create(data as CreateCashFlowInput)
      }
      setCashFlowFormOpen(false)
      setEditingCashFlow(null)
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, t("errors:failedToSaveCashFlow"))
    }
  }

  const handleEditCashFlow = (id: string) => {
    const flow = cashFlows.find((f) => f.id === id)
    if (flow) {
      setEditingCashFlow(flow)
      setCashFlowAccountId(flow.accountId)
      setCashFlowFormOpen(true)
    }
  }

  const handleDeleteCashFlow = async (id: string) => {
    try {
      await api.cashFlows.delete(id)
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, t("errors:failedToDeleteCashFlow"))
    }
  }

  const handleToggleCashFlow = async (id: string) => {
    const flow = cashFlows.find((f) => f.id === id)
    if (!flow) return
    try {
      await api.cashFlows.update(id, { isActive: !flow.isActive })
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, t("errors:failedToToggleCashFlow"))
    }
  }

  const handleCashFlowFormClose = (open: boolean) => {
    setCashFlowFormOpen(open)
    if (!open) {
      setEditingCashFlow(null)
      setDefaultFlowType(undefined)
    }
  }

  const openAddFlow = (accountId: string, flowType: "inflow" | "outflow") => {
    setCashFlowAccountId(accountId)
    setEditingCashFlow(null)
    setDefaultFlowType(flowType)
    setCashFlowFormOpen(true)
  }

  return {
    accountFormOpen,
    editingAccount,
    deleteAccountDialogOpen,
    accountToDelete,
    cashFlowFormOpen,
    editingCashFlow,
    cashFlowAccountId,
    defaultFlowType,
    setAccountFormOpen,
    setDeleteAccountDialogOpen,
    handleAddAccount,
    handleEditAccount,
    handleUpdateAccount,
    handleAccountFormClose,
    handleDeleteAccountRequest,
    handleConfirmDeleteAccount,
    handleAddCashFlow,
    handleEditCashFlow,
    handleDeleteCashFlow,
    handleToggleCashFlow,
    handleCashFlowFormClose,
    openAddFlow,
  }
}
