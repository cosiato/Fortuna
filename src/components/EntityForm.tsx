import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { Entity } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEntitySchema, validateSchema } from "@/lib/validation"
import { toast } from "sonner"

interface EntityFormProps {
  entity?: Entity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string }) => void
  onDelete?: (id: number) => void
}

export default function EntityForm({
  entity,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: EntityFormProps) {
  const { t } = useTranslation("entities")
  const [name, setName] = useState(entity?.name ?? "")

  useEffect(() => {
    if (entity) {
      setName(entity.name ?? "")
    } else {
      setName("")
    }
  }, [entity, open])

  const isEditing = !!entity
  const isIndividual = entity?.type === "individual"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name: name.trim() }
    const result = validateSchema(createEntitySchema(), data)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    onSubmit(data)
  }

  const handleDelete = () => {
    if (entity && onDelete && !isIndividual) {
      onDelete(entity.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editEntity") : t("addCompany")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name", { ns: "common" })}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEditing ? "" : t("namePlaceholder")}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing && !isIndividual && onDelete && (
              <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete}>
                {t("delete", { ns: "common" })}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" variant="default" className="flex-1">
              {isEditing ? t("update", { ns: "common" }) : t("addBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
