import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Obriši
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
