import type { Entity } from "@/types/database";
import { Trans, useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

interface DeleteEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
  associatedAssetCount: number;
  associatedAccountCount: number;
  onConfirm: () => void;
}

export default function DeleteEntityDialog({
  open,
  onOpenChange,
  entity,
  associatedAssetCount,
  associatedAccountCount,
  onConfirm,
}: DeleteEntityDialogProps) {
  const { t } = useTranslation("dialogs");

  if (!entity) return null;

  const hasAssociatedData =
    associatedAssetCount > 0 || associatedAccountCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Icon
                icon="solar:trash-bin-trash-linear"
                width={20}
                height={20}
                className="text-red-500"
              />
            </div>
            <div>
              <DialogTitle className="text-red-500">
                {t("deleteEntity.title")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("deleteEntity.cannotBeUndone")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-foreground">
            <Trans
              ns="dialogs"
              i18nKey="deleteEntity.confirmMessage"
              values={{ name: entity.name }}
              components={{ bold: <span className="font-semibold" /> }}
            />
          </p>

          {hasAssociatedData && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <Icon
                  icon="solar:danger-triangle-linear"
                  width={18}
                  height={18}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-500">
                    {t("deleteEntity.warningTitle")}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {associatedAssetCount > 0 && (
                      <li className="flex items-center gap-2">
                        <Icon icon="solar:box-linear" width={14} height={14} />
                        <span>
                          {t("deleteEntity.asset", {
                            count: associatedAssetCount,
                          })}
                        </span>
                      </li>
                    )}
                    {associatedAccountCount > 0 && (
                      <li className="flex items-center gap-2">
                        <Icon icon="solar:safe-linear" width={14} height={14} />
                        <span>
                          {t("deleteEntity.vault", {
                            count: associatedAccountCount,
                          })}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
            >
              {t("delete", { ns: "common" })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
