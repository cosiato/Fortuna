import type { Account } from "@/types/database";
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

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  associatedCashFlowCount: number;
  onConfirm: () => void;
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  account,
  associatedCashFlowCount,
  onConfirm,
}: DeleteAccountDialogProps) {
  const { t } = useTranslation("dialogs");

  if (!account) return null;

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
                {t("deleteVault.title")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("deleteVault.cannotBeUndone")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-foreground">
            <Trans
              ns="dialogs"
              i18nKey="deleteVault.confirmMessage"
              values={{ name: account.name }}
              components={{ bold: <span className="font-semibold" /> }}
            />
          </p>

          {associatedCashFlowCount > 0 && (
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
                    {t("deleteVault.warningTitle")}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Icon
                        icon="solar:round-transfer-vertical-linear"
                        width={14}
                        height={14}
                      />
                      <span>
                        {t("deleteVault.cashFlow", {
                          count: associatedCashFlowCount,
                        })}
                      </span>
                    </li>
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
