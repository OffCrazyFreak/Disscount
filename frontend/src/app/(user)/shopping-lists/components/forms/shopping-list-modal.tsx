"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import { shoppingListRequestSchema } from "@/lib/api/types";
import { useShoppingListModal } from "@/app/(user)/shopping-lists/hooks/use-shopping-list-modal";

interface IShoppingListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  shoppingList?: ShoppingListDto | null;
}

export default function ShoppingListModal({
  isOpen,
  onOpenChange,
  onSuccess,
  shoppingList,
}: IShoppingListModalProps) {
  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    defaultValues: {
      title: shoppingList?.title || "",
      isPublic: shoppingList?.isPublic || false,
    },
  });

  const { onSubmit, handleCancel, isLoading } = useShoppingListModal({
    shoppingList,
    onSuccess,
    onOpenChange,
    setError: form.setError,
    reset: form.reset,
  });

  // Reset form when shopping list changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: shoppingList?.title || "",
        isPublic: shoppingList?.isPublic || false,
      });
    }
  }, [isOpen, shoppingList, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {shoppingList ? "Uredi popis za kupnju" : "Novi popis za kupnju"}
          </DialogTitle>
        </DialogHeader>

        {form.formState.errors.root && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {form.formState.errors.root.message}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv popisa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Roštilj 01.05.2026."
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                effect="ringHover"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Odustani
              </Button>

              <Button
                type="submit"
                variant="default"
                effect="expandIcon"
                icon={Save}
                iconPlacement="right"
                disabled={isLoading}
                loading={isLoading}
              >
                {shoppingList ? "Ažuriraj" : "Stvori"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
