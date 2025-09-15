"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button-icon";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { shoppingListService } from "@/lib/api";
import {
  shoppingListRequestSchema,
  type ShoppingListRequest,
} from "@/lib/api/schemas/shopping-list";
import { ShoppingListDto } from "@/lib/api/types";
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
  const [createdListId, setCreatedListId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const queryClient = useQueryClient();

  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const updateShoppingListMutation =
    shoppingListService.useUpdateShoppingList();

  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    defaultValues: {
      title: "",
      isPublic: false,
      aiPrompt: undefined,
    },
  });

  // When shoppingList prop changes, populate the form for editing
  useEffect(() => {
    if (shoppingList) {
      form.reset({
        title: shoppingList.title ?? "",
        isPublic: shoppingList.isPublic ?? false,
        aiPrompt: undefined,
      });
    } else {
      form.reset({ title: "", isPublic: false, aiPrompt: undefined });
    }
    setCreatedListId(null);
    setIsCopied(false);
  }, [shoppingList, form]);

  const watchIsPublic = form.watch("isPublic");

  const isSubmitting = shoppingList
    ? updateShoppingListMutation.isPending
    : createShoppingListMutation.isPending;

  const onSubmit = (data: ShoppingListRequest) => {
    if (shoppingList) {
      updateShoppingListMutation.mutate(
        {
          id: shoppingList.id,
          data: { title: data.title, isPublic: data.isPublic },
        },
        {
          onSuccess: async () => {
            toast.success("Popis za kupnju je uspješno ažuriran!");

            await queryClient.invalidateQueries({
              queryKey: ["shoppingLists"],
            });

            onOpenChange(false);
            form.reset();
            onSuccess?.();
          },
          onError: (error: Error) => {
            toast.error(
              error.message || "Greška pri ažuriranju popisa za kupnju"
            );
          },
        }
      );
    } else {
      createShoppingListMutation.mutate(
        {
          title: data.title,
          isPublic: data.isPublic,
        },
        {
          onSuccess: async (response: ShoppingListDto) => {
            toast.success("Popis za kupnju je uspješno kreiran!");
            setCreatedListId(response.id);

            await queryClient.invalidateQueries({
              queryKey: ["shoppingLists"],
            });

            // Don't reset or close the form if it's public, so user can copy the link
            if (!data.isPublic) {
              form.reset();
              onOpenChange(false);
            }
            onSuccess?.();
          },
          onError: (error: Error) => {
            toast.error(
              error.message || "Greška pri kreiranju popisa za kupnju"
            );
          },
        }
      );
    }
  };

  const copyToClipboard = async () => {
    if (!createdListId) return;

    const link = `${window.location.origin}/shopping-lists/${createdListId}`;
    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_err) {
      toast.error("Greška pri kopiranju poveznice");
    }
  };

  const handleCancel = () => {
    form.reset();
    setCreatedListId(null);
    setIsCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl">Popis za kupnju</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv liste</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Roštilj 01.05." autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {shoppingList && (
              <div>
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Javna lista</FormLabel>
                        <FormDescription>
                          Drugi korisnici će moći dohvatiti listu pomoću
                          sljedeće poveznice:
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchIsPublic && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Poveznica za dijeljenje:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${
                          typeof window !== "undefined"
                            ? window.location.origin
                            : "https://disscount.dev"
                        }/shopping-lists/${createdListId}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                        className="shrink-0"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button
                size="lg"
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {createdListId ? "Zatvori" : "Odustani"}
              </Button>
              {!createdListId && (
                <Button size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : shoppingList ? (
                    "Spremi"
                  ) : (
                    "Izradi"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
