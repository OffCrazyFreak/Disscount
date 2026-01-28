import { Loader2 } from "lucide-react";
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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Obriši popis za kupnju</DialogTitle>
          <DialogDescription>
            Jeste li sigurni da želite obrisati popis &quot;{listTitle}&quot;?
            Ova akcija se ne može poništiti.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="flex justify-between items-center w-full flex-row">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Odustani
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
              Obriši
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
