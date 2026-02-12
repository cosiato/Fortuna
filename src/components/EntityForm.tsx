import { useState, useEffect } from "react"
import type { Entity } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { entitySchema, validateSchema } from "@/lib/validation"
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
    const result = validateSchema(entitySchema, data)
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
          <DialogTitle>{isEditing ? "Edit Entity" : "Add New Company"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEditing ? "" : "e.g., Acme Corp, My LLC"}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing && !isIndividual && onDelete && (
              <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" className="flex-1">
              {isEditing ? "Update" : "Add New"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
