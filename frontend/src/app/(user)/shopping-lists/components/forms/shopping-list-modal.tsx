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
import {
  ShoppingListDto,
  ShoppingListRequest,
  shoppingListRequestSchema,
} from "@/lib/api/types";
import { shoppingListService } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const createMutation = shoppingListService.useCreateShoppingList();
  const updateMutation = shoppingListService.useUpdateShoppingList();

  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    defaultValues: {
      title: shoppingList?.title || "",
      isPublic: shoppingList?.isPublic || false,
    },
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

  function onSubmit(data: ShoppingListRequest) {
    if (shoppingList) {
      updateMutation.mutate(
        { id: shoppingList.id, data },
        {
          onSuccess: async () => {
            toast.success("Popis za kupnju je uspješno ažuriran!");
            await queryClient.invalidateQueries({
              queryKey: ["shoppingLists"],
            });
            await onSuccess?.();
            onOpenChange(false);
          },
          onError: (error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            form.setError("root", {
              message:
                message || "Došlo je do greške prilikom ažuriranja popisa",
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: async () => {
          toast.success("Popis za kupnju je uspješno kreiran!");
          await queryClient.invalidateQueries({
            queryKey: ["shoppingLists"],
          });
          await onSuccess?.();
          onOpenChange(false);
          form.reset();
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          form.setError("root", {
            message: message || "Došlo je do greške prilikom kreiranja popisa",
          });
        },
      });
    }
  }

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
