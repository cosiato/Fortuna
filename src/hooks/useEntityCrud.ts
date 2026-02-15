import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Asset, Account, Entity } from "@/types/database"
import { api } from "@/lib/api"
import { showErrorToast } from "@/lib/errorHandling"

interface UseEntityCrudOptions {
  fetchDataOnly: () => Promise<{ assetsData: Asset[]; accountsData: Account[] }>
  requestSnapshot: () => void
}

export function useEntityCrud({ fetchDataOnly, requestSnapshot }: UseEntityCrudOptions) {
  const [entityFormOpen, setEntityFormOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)
  const [selectedEntityId, setSelectedEntityId] = useState<number>(0)

  const { t } = useTranslation(["errors"])

  const handleAddCompany = async (data: { name: string }) => {
    try {
      await api.entities.create({ name: data.name, type: "company" })
      setEntityFormOpen(false)
      await fetchDataOnly()
    } catch (error) {
      showErrorToast(error, t("errors:failedToCreateEntity"))
    }
  }

  const handleEditEntity = (entity: Entity) => {
    setEditingEntity(entity)
    setEntityFormOpen(true)
  }

  const handleUpdateEntity = async (data: { name: string }) => {
    if (!editingEntity) return
    try {
      await api.entities.update(editingEntity.id, { name: data.name })
      setEntityFormOpen(false)
      setEditingEntity(null)
      await fetchDataOnly()
    } catch (error) {
      showErrorToast(error, t("errors:failedToUpdateEntity"))
    }
  }

  const handleEntityFormClose = (open: boolean) => {
    setEntityFormOpen(open)
    if (!open) {
      setEditingEntity(null)
    }
  }

  const handleDeleteEntityRequest = (entity: Entity) => {
    setEntityToDelete(entity)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteEntity = async () => {
    if (!entityToDelete) return

    try {
      await api.entities.deleteCascade(entityToDelete.id)

      if (selectedEntityId === entityToDelete.id) {
        setSelectedEntityId(0)
      }

      setDeleteDialogOpen(false)
      setEntityToDelete(null)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, t("errors:failedToDeleteEntity"))
    }
  }

  return {
    selectedEntityId,
    setSelectedEntityId,
    entityFormOpen,
    editingEntity,
    deleteDialogOpen,
    entityToDelete,
    setEntityFormOpen,
    handleAddCompany,
    handleEditEntity,
    handleUpdateEntity,
    handleEntityFormClose,
    handleDeleteEntityRequest,
    handleConfirmDeleteEntity,
    setDeleteDialogOpen,
  }
}
