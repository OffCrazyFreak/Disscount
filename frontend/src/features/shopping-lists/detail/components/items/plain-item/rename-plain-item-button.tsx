import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/features/shopping-lists/detail/typings/shopping-list-item-types";

// The backend's limit on an item name.
const MAX_NAME_LENGTH = 255;

interface IRenamePlainItemButtonProps {
  item: ShoppingListItemDto;
  /** Owners and EDIT members, the ones the backend lets change a name. */
  canRename: boolean;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
}

/** A dialog, because an inline editor would fight the row's tap targets on a phone. */
export default function RenamePlainItemButton({
  item,
  canRename,
  onUpdate,
}: IRenamePlainItemButtonProps) {
  const t = useTranslations("shoppingListDetail.items");
  const formId = useId();
  const fieldId = useId();
  const errorId = useId();
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [showsError, setShowsError] = useState(false);
  const trimmed = name.trim();

  // A catalogue item's name is the product's, so only a plain item is renamed.
  if (item.ean || !canRename) return null;

  function open() {
    setName(item.name);
    setShowsError(false);
    setOpen(true);
  }

  function save() {
    if (!trimmed) {
      setShowsError(true);
      return;
    }

    if (trimmed !== item.name) {
      onUpdate({
        isChecked: item.isChecked,
        amount: item.amount || 1,
        chainCode: item.chainCode ?? null,
        name: trimmed,
      });
    }

    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("rename", { name: item.name })}
        onClick={open}
        className="relative z-20 size-8 shrink-0 text-muted-foreground"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Button>

      <ModalShell
        open={isOpen}
        onOpenChange={setOpen}
        size="sm"
        title={t("renameTitle")}
        formId={formId}
        cancelLabel={t("renameCancel")}
        onCancel={() => setOpen(false)}
        submitLabel={t("renameSave")}
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="space-y-2"
        >
          <Label htmlFor={fieldId}>
            {t("renameField")}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </Label>

          <Input
            id={fieldId}
            // The shell focuses its container unless a field asks, and Enter there would save the old name.
            autoFocus
            value={name}
            maxLength={MAX_NAME_LENGTH}
            aria-required="true"
            aria-invalid={showsError && !trimmed}
            aria-describedby={showsError && !trimmed ? errorId : undefined}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setShowsError(true)}
            autoComplete="off"
          />

          {showsError && !trimmed && (
            <p id={errorId} className="text-sm text-destructive">
              {t("renameRequired")}
            </p>
          )}
        </form>
      </ModalShell>
    </>
  );
}
