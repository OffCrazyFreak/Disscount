import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  listTitle: string;
}

export default function DeleteListDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  listTitle,
}: DeleteListDialogProps) {
  const t = useTranslations("pages.shoppingLists.deleteDialog");
  const tCommon = useTranslations("common");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { title: listTitle })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="flex justify-between items-center w-full flex-row">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>

            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              size="lg"
              variant="destructive"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              {tCommon("delete")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
