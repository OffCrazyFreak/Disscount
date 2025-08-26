"use client";

import { DigitalCardDto } from "@/lib/api/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DigitalCardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  digitalCard?: DigitalCardDto | null;
}

export default function DigitalCardModal({
  isOpen,
  onOpenChange,
  onSuccess,
  digitalCard,
}: DigitalCardModalProps) {
  const isEditing = !!digitalCard;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Uredi digitalnu karticu" : "Nova digitalna kartica"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 text-center text-gray-500">
          <p>Form će biti implementiran kasnije...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
