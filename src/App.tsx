import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { open } from "@tauri-apps/plugin-dialog"
import { relaunch } from "@tauri-apps/plugin-process"
import { useTranslation } from "react-i18next"
import DashboardView from "@/components/DashboardView"
import EntityView from "@/components/EntityView"
import AssetForm from "@/components/AssetForm"
import AccountForm from "@/components/AccountForm"
import CashFlowForm from "@/components/CashFlowForm"
import CurrencyPickerOverlay from "@/components/CurrencyPickerOverlay"
import type { Asset, Account } from "@/types/database"
import { api } from "@/lib/api"
import { SupportedCurrency } from "@/lib/currency"
import AppSidebar from "@/components/AppSidebar"
import EntityForm from "@/components/EntityForm"
import DeleteEntityDialog from "@/components/DeleteEntityDialog"
import DeleteAccountDialog from "@/components/DeleteAccountDialog"
import ResetAccountDialog from "@/components/ResetAccountDialog"
import RestoreBackupDialog from "@/components/RestoreBackupDialog"
import LockScreen from "@/components/LockScreen"
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay"
import UpdateNotification from "@/components/UpdateNotification"
import SettingsView from "@/components/settings/SettingsView"
import { showErrorToast } from "@/lib/errorHandling"
import { useSnapshotRecorder } from "@/hooks/useSnapshotRecorder"
import { getAssetValueInUsd, toUsd, fromUsd, toDisplayCurrency } from "@/lib/currencyConversion"
import { calculateMonthlyTotals } from "@/lib/cashFlowProjection"
import { ASSET_CATEGORY_KEYS } from "@/lib/dashboardUtils"
import { useAppData } from "@/hooks/useAppData"
import { useAssetCrud } from "@/hooks/useAssetCrud"
import { useVaultCrud } from "@/hooks/useVaultCrud"
import { useEntityCrud } from "@/hooks/useEntityCrud"
import { useUpdater } from "@/hooks/useUpdater"
import { useSidebar } from "@/hooks/useSidebar"
import { usePrivacyModeState, PrivacyModeContext } from "@/hooks/usePrivacyMode"

// App lifecycle phases:
// 1. "checking"  - Fast pre-check: PIN status, locale, currency (no data loaded)
// 2. "locked"    - PIN is enabled: show lock screen, nothing else in DOM
// 3. "loading"   - After unlock (or no PIN): splash screen while data loads
// 4. "ready"     - Data loaded: show full app content
type AppPhase = "checking" | "locked" | "loading" | "ready"

type CurrentView = "dashboard" | "entity" | "settings"

function SplashScreen() {
  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <img src="/logo.png" alt="Fortuna" className="w-24 h-24 animate-gentle-bounce-lg" />
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("checking")
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>("USD")
  const [currentView, setCurrentView] = useState<CurrentView>("dashboard")
  const [isPinEnabled, setIsPinEnabled] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoreFilePath, setRestoreFilePath] = useState("")
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
  const handleCloseCurrencyPicker = useCallback(() => setCurrencyPickerOpen(false), [])

  const { t } = useTranslation(["common", "assets", "vaults", "errors"])
  const updater = useUpdater()
  const sidebar = useSidebar()
  const privacyMode = usePrivacyModeState()
  const { state: appData, actions: appActions, preCheck, onboardingResult } = useAppData()
  const {
    assets,
    accounts,
    snapshots,
    entities,
    cashFlows,
    prices,
    exchangeRates,
    loading,
    isRefreshing,
    refreshCooldown,
  } = appData

  // Phase 1 -> Phase 2 or 3: React to pre-check results
  useEffect(() => {
    if (phase !== "checking" || !preCheck) return

    setDisplayCurrency(preCheck.displayCurrency)
    setIsPinEnabled(preCheck.isPinEnabled)

    if (preCheck.isPinEnabled) {
      // PIN enabled: go to lock screen, data loading deferred until unlock
      api.settings.lockApp().catch(() => {})
      setPhase("locked")
    } else {
      // No PIN: skip lock, start loading data immediately
      appActions.startLoading()
      setPhase("loading")
    }
  }, [phase, preCheck, appActions.startLoading])

  // Phase 3 -> Phase 4: Data finished loading
  useEffect(() => {
    if (phase !== "loading") return
    if (loading) return

    if (onboardingResult?.showOnboarding) {
      setShowOnboarding(true)
    }
    setPhase("ready")
  }, [phase, loading, onboardingResult])

  const handleUnlock = useCallback(() => {
    // After successful PIN entry: transition to loading phase
    appActions.startLoading()
    setPhase("loading")
  }, [appActions])

  const handleLock = useCallback(async () => {
    try {
      await api.settings.lockApp()
    } catch {
      // Lock frontend even if backend call fails
    }
    appActions.resetForLock()
    setPhase("locked")
  }, [appActions.resetForLock])

  const handleCurrencyChange = async (currency: SupportedCurrency) => {
    setDisplayCurrency(currency)
    try {
      await api.settings.setCurrencyPreference(currency)
    } catch (error) {
      showErrorToast(error, t("errors:failedToSaveCurrency"))
    }
  }

  const handleResetAccount = async (pin?: string) => {
    try {
      await api.settings.resetAllData(pin)
      appActions.setPrices({})
      setIsPinEnabled(false)
      setCurrentView("dashboard")
      entityCrud.setSelectedEntityId(0)
      setResetDialogOpen(false)
      localStorage.removeItem("fortuna_onboarding_completed")
      setShowOnboarding(true)
      await appActions.fetchDataOnly()
    } catch (error) {
      showErrorToast(error, t("errors:failedToResetData"))
    }
  }

  const handleRestoreBackup = async () => {
    try {
      const selected = await open({
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
        multiple: false,
        directory: false,
      })

      if (!selected) return

      setRestoreFilePath(selected)
      setRestoreDialogOpen(true)
    } catch (error) {
      showErrorToast(error, t("errors:failedToImportData"))
    }
  }

  const handleConfirmRestore = async (pin?: string) => {
    try {
      await api.settings.importDatabase(restoreFilePath, pin)
      await relaunch()
    } catch (error) {
      showErrorToast(error, t("errors:failedToImportData"))
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l" && isPinEnabled && phase === "ready") {
        e.preventDefault()
        handleLock()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPinEnabled, phase, handleLock])

  const netWorthUsd =
    assets.reduce((sum, asset) => sum + getAssetValueInUsd(asset, prices, exchangeRates), 0) +
    accounts.reduce(
      (sum, account) => sum + toUsd(account.balance, account.currency, exchangeRates),
      0,
    )
  const netWorth = fromUsd(netWorthUsd, displayCurrency, exchangeRates)

  const { requestSnapshot, recordSnapshotNow } = useSnapshotRecorder({
    netWorth: netWorthUsd,
    currency: "USD",
    enabled: phase === "ready",
    onSnapshotsUpdated: appActions.refreshSnapshots,
  })

  const entityCrud = useEntityCrud({
    fetchDataOnly: appActions.fetchDataOnly,
    requestSnapshot,
  })

  const handleNavigateDashboard = useCallback(() => {
    setCurrentView("dashboard")
    entityCrud.setSelectedEntityId(0)
  }, [entityCrud.setSelectedEntityId])

  const handleNavigateSettings = useCallback(() => {
    setCurrentView("settings")
    entityCrud.setSelectedEntityId(0)
  }, [entityCrud.setSelectedEntityId])

  const handleSelectEntity = useCallback(
    (entityId: number) => {
      entityCrud.setSelectedEntityId(entityId)
      setCurrentView("entity")
    },
    [entityCrud.setSelectedEntityId],
  )

  const assetCrud = useAssetCrud({
    selectedEntityId: entityCrud.selectedEntityId,
    fetchDataOnly: appActions.fetchDataOnly,
    requestSnapshot,
    setAssets: appActions.setAssets,
    setPrices: appActions.setPrices,
  })

  const vaultCrud = useVaultCrud({
    selectedEntityId: entityCrud.selectedEntityId,
    cashFlows,
    setCashFlows: appActions.setCashFlows,
    fetchDataOnly: appActions.fetchDataOnly,
    requestSnapshot,
  })

  const filteredAssets = assets.filter((asset) => asset.entityId === entityCrud.selectedEntityId)
  const filteredAccounts = accounts.filter(
    (account) => account.entityId === entityCrud.selectedEntityId,
  )

  const getAssetValue = useCallback(
    (asset: Asset): number =>
      fromUsd(getAssetValueInUsd(asset, prices, exchangeRates), displayCurrency, exchangeRates),
    [prices, exchangeRates, displayCurrency],
  )

  const getAccountValue = useCallback(
    (account: Account): number =>
      toDisplayCurrency(account.balance, account.currency, displayCurrency, exchangeRates),
    [displayCurrency, exchangeRates],
  )

  const entityTotals = useMemo(
    () =>
      entities.reduce<Record<number, number>>((acc, entity) => {
        const entityAssets = assets.filter((a) => a.entityId === entity.id)
        const entityAccounts = accounts.filter((a) => a.entityId === entity.id)

        const assetsTotal = entityAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0)
        const accountsTotal = entityAccounts.reduce(
          (sum, account) => sum + getAccountValue(account),
          0,
        )

        return { ...acc, [entity.id]: assetsTotal + accountsTotal }
      }, {}),
    [entities, assets, accounts, getAssetValue, getAccountValue],
  )

  // Compute global monthly cash flow totals across all accounts
  const globalMonthlyTotals = useMemo(() => {
    let totalInflow = 0
    let totalOutflow = 0

    for (const account of accounts) {
      const accountFlows = cashFlows.filter((f) => f.accountId === account.id)
      const totals = calculateMonthlyTotals(accountFlows)
      totalInflow += toDisplayCurrency(
        totals.totalInflow,
        account.currency,
        displayCurrency,
        exchangeRates,
      )
      totalOutflow += toDisplayCurrency(
        totals.totalOutflow,
        account.currency,
        displayCurrency,
        exchangeRates,
      )
    }

    return { totalInflow, totalOutflow, net: totalInflow - totalOutflow }
  }, [accounts, cashFlows, displayCurrency, exchangeRates])

  // Compute liquid vs illiquid totals
  const liquidityTotals = useMemo(() => {
    const liquidAssetTypes = new Set(["stock", "cash"])
    const illiquidAssetTypes = new Set(["real_estate", "other"])

    let liquid = 0
    let illiquid = 0

    for (const acc of accounts) {
      const value = getAccountValue(acc)
      if (acc.isLiquid) {
        liquid += value
      } else {
        illiquid += value
      }
    }

    for (const asset of assets) {
      const value = getAssetValue(asset)
      if (asset.type === "crypto" && asset.stakedQuantity && asset.quantity > 0) {
        const clampedStaked = Math.min(asset.stakedQuantity, asset.quantity)
        const stakedFraction = clampedStaked / asset.quantity
        const stakedValue = value * stakedFraction
        liquid += value - stakedValue
        illiquid += stakedValue
      } else if (asset.type === "crypto" || liquidAssetTypes.has(asset.type)) {
        liquid += value
      } else if (illiquidAssetTypes.has(asset.type)) {
        illiquid += value
      }
    }

    return { liquid, illiquid }
  }, [assets, accounts, getAssetValue, getAccountValue])

  const categoryBadgeData = useMemo(
    () =>
      ASSET_CATEGORY_KEYS.map((key) => {
        const catAssets = assets.filter((a) => a.type === key)
        const total = catAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0)
        return { key, label: t(`assets:type.${key}`), count: catAssets.length, total }
      }).filter((c) => c.count > 0),
    [assets, getAssetValue, t],
  )

  const vaultBadgeTotal = useMemo(
    () => accounts.reduce((sum, acc) => sum + getAccountValue(acc), 0),
    [accounts, getAccountValue],
  )

  const recordSnapshotNowRef = useRef(recordSnapshotNow)
  recordSnapshotNowRef.current = recordSnapshotNow

  useEffect(() => {
    if (phase === "ready" && (assets.length > 0 || accounts.length > 0)) {
      recordSnapshotNowRef.current()
      api.snapshots.prune().catch(() => {
        // Pruning is best-effort; failures do not affect user experience
      })
    }
  }, [phase, assets.length, accounts.length])

  // When entity is deleted and was the selected one, return to dashboard
  useEffect(() => {
    if (currentView === "entity" && !entities.some((e) => e.id === entityCrud.selectedEntityId)) {
      setCurrentView("dashboard")
    }
  }, [entities, entityCrud.selectedEntityId, currentView])

  // --- Rendering decision ---

  // Phase 1: Pre-check in progress, show splash
  if (phase === "checking") {
    return <SplashScreen />
  }

  // Phase 2: Lock screen - only this, no app content in DOM
  if (phase === "locked") {
    return <LockScreen onUnlock={handleUnlock} />
  }

  // Phase 3: Data loading after unlock, show splash
  if (phase === "loading") {
    return <SplashScreen />
  }

  // Phase 4: Ready - render full app
  return (
    <PrivacyModeContext.Provider value={privacyMode}>
      <div className="h-screen flex flex-row bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-vignette pointer-events-none" />
        <AppSidebar
          isCollapsed={sidebar.isCollapsed}
          onToggle={sidebar.toggle}
          entities={entities}
          selectedEntityId={entityCrud.selectedEntityId}
          onSelectEntity={handleSelectEntity}
          onAddCompany={() => entityCrud.setEntityFormOpen(true)}
          onEditEntity={entityCrud.handleEditEntity}
          onDeleteEntity={entityCrud.handleDeleteEntityRequest}
          entityTotals={entityTotals}
          displayCurrency={displayCurrency}
          onRefresh={appActions.handleManualRefresh}
          isRefreshing={isRefreshing}
          refreshCooldown={refreshCooldown}
          onCurrencyClick={() => setCurrencyPickerOpen(true)}
          onSettingsClick={handleNavigateSettings}
          currentView={currentView}
          onNavigateDashboard={handleNavigateDashboard}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div
            className="shrink-0 h-9 cursor-grab active:cursor-grabbing"
            onMouseDown={() => getCurrentWindow().startDragging()}
            onDoubleClick={async () => {
              const win = getCurrentWindow()
              const maximized = await win.isMaximized()
              if (maximized) {
                await win.unmaximize()
              } else {
                await win.maximize()
              }
            }}
          />
          <div className="flex-1 overflow-y-auto overscroll-none custom-scrollbar relative">
            <div className="max-w-7xl mx-auto px-6 py-6">
              {currentView === "settings" ? (
                <SettingsView
                  displayCurrency={displayCurrency}
                  onCurrencyClick={() => setCurrencyPickerOpen(true)}
                  isPinEnabled={isPinEnabled}
                  onPinStatusChange={setIsPinEnabled}
                  onLock={handleLock}
                  onResetAccount={() => setResetDialogOpen(true)}
                  onRestoreBackup={handleRestoreBackup}
                />
              ) : currentView === "dashboard" ? (
                <DashboardView
                  netWorth={netWorth}
                  netWorthUsd={netWorthUsd}
                  displayCurrency={displayCurrency}
                  categoryBadgeData={categoryBadgeData}
                  vaultBadgeTotal={vaultBadgeTotal}
                  accountCount={accounts.length}
                  snapshots={snapshots}
                  exchangeRates={exchangeRates}
                  entities={entities}
                  entityTotals={entityTotals}
                  onSelectEntity={handleSelectEntity}
                  monthlyTotals={globalMonthlyTotals}
                  assets={assets}
                  accounts={accounts}
                  getAssetValue={getAssetValue}
                  getAccountValue={getAccountValue}
                  liquidTotal={liquidityTotals.liquid}
                  illiquidTotal={liquidityTotals.illiquid}
                />
              ) : (
                <EntityView
                  entityName={
                    entities.find((e) => e.id === entityCrud.selectedEntityId)?.name ?? ""
                  }
                  entityType={
                    entities.find((e) => e.id === entityCrud.selectedEntityId)?.type ?? "individual"
                  }
                  entityTotal={entityTotals[entityCrud.selectedEntityId] ?? 0}
                  assets={filteredAssets}
                  accounts={filteredAccounts}
                  cashFlows={cashFlows}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates}
                  getAssetValue={getAssetValue}
                  getAccountValue={getAccountValue}
                  onAddAsset={() => assetCrud.setAssetFormOpen(true)}
                  onEditAsset={assetCrud.handleEditAsset}
                  onDeleteAsset={assetCrud.handleDeleteAsset}
                  onQuantityChange={assetCrud.handleQuantityChange}
                  onAddAccount={() => vaultCrud.setAccountFormOpen(true)}
                  onEditAccount={vaultCrud.handleEditAccount}
                  onDeleteAccountRequest={vaultCrud.handleDeleteAccountRequest}
                  onEditCashFlow={vaultCrud.handleEditCashFlow}
                  onDeleteCashFlow={vaultCrud.handleDeleteCashFlow}
                  onToggleCashFlow={vaultCrud.handleToggleCashFlow}
                  onAddFlow={vaultCrud.openAddFlow}
                />
              )}

              <AssetForm
                asset={assetCrud.editingAsset}
                open={assetCrud.assetFormOpen}
                onOpenChange={assetCrud.handleAssetFormClose}
                onSubmit={
                  assetCrud.editingAsset ? assetCrud.handleUpdateAsset : assetCrud.handleAddAsset
                }
              />

              <AccountForm
                account={vaultCrud.editingAccount}
                open={vaultCrud.accountFormOpen}
                onOpenChange={vaultCrud.handleAccountFormClose}
                onSubmit={
                  vaultCrud.editingAccount
                    ? vaultCrud.handleUpdateAccount
                    : vaultCrud.handleAddAccount
                }
              />

              <CashFlowForm
                cashFlow={vaultCrud.editingCashFlow}
                accountId={vaultCrud.cashFlowAccountId}
                accountCurrency={
                  accounts.find((a) => a.id === vaultCrud.cashFlowAccountId)?.currency
                }
                defaultFlowType={vaultCrud.defaultFlowType}
                open={vaultCrud.cashFlowFormOpen}
                onOpenChange={vaultCrud.handleCashFlowFormClose}
                onSubmit={vaultCrud.handleAddCashFlow}
              />

              <EntityForm
                entity={entityCrud.editingEntity}
                open={entityCrud.entityFormOpen}
                onOpenChange={entityCrud.handleEntityFormClose}
                onSubmit={
                  entityCrud.editingEntity
                    ? entityCrud.handleUpdateEntity
                    : entityCrud.handleAddCompany
                }
              />

              <DeleteEntityDialog
                open={entityCrud.deleteDialogOpen}
                onOpenChange={entityCrud.setDeleteDialogOpen}
                entity={entityCrud.entityToDelete}
                associatedAssetCount={
                  entityCrud.entityToDelete
                    ? assets.filter((a) => a.entityId === entityCrud.entityToDelete!.id).length
                    : 0
                }
                associatedAccountCount={
                  entityCrud.entityToDelete
                    ? accounts.filter((a) => a.entityId === entityCrud.entityToDelete!.id).length
                    : 0
                }
                onConfirm={entityCrud.handleConfirmDeleteEntity}
              />

              <DeleteAccountDialog
                open={vaultCrud.deleteAccountDialogOpen}
                onOpenChange={vaultCrud.setDeleteAccountDialogOpen}
                account={vaultCrud.accountToDelete}
                associatedCashFlowCount={
                  vaultCrud.accountToDelete
                    ? cashFlows.filter((f) => f.accountId === vaultCrud.accountToDelete!.id).length
                    : 0
                }
                onConfirm={vaultCrud.handleConfirmDeleteAccount}
              />

              <ResetAccountDialog
                open={resetDialogOpen}
                onOpenChange={setResetDialogOpen}
                onConfirm={handleResetAccount}
                pinEnabled={isPinEnabled}
              />

              <RestoreBackupDialog
                open={restoreDialogOpen}
                onOpenChange={(open) => {
                  setRestoreDialogOpen(open)
                  if (!open) setRestoreFilePath("")
                }}
                onConfirm={handleConfirmRestore}
                pinEnabled={isPinEnabled}
                selectedFile={restoreFilePath}
              />
            </div>
          </div>
        </main>

        <UpdateNotification
          status={updater.status}
          version={updater.updateInfo?.version ?? null}
          progress={updater.progress}
          onDownload={updater.downloadAndInstall}
          onDismiss={updater.dismiss}
        />
        <CurrencyPickerOverlay
          open={currencyPickerOpen}
          value={displayCurrency}
          onSelect={handleCurrencyChange}
          onClose={handleCloseCurrencyPicker}
        />
        <OnboardingOverlay
          show={showOnboarding}
          onComplete={() => {
            localStorage.setItem("fortuna_onboarding_completed", "true")
            setShowOnboarding(false)
          }}
        />
      </div>
    </PrivacyModeContext.Provider>
  )
}
