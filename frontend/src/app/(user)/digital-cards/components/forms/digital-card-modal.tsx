"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DigitalCardDto,
  DigitalCardRequest,
  digitalCardRequestSchema,
} from "@/lib/api/types";
import { digitalCardService } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const createMutation = digitalCardService.useCreateDigitalCard();
  const updateMutation = digitalCardService.useUpdateDigitalCard();

  const form = useForm<DigitalCardRequest>({
    resolver: zodResolver(digitalCardRequestSchema),
    defaultValues: {
      title: digitalCard?.title || "",
      value: digitalCard?.value || "",
      type: digitalCard?.type || "loyalty",
      codeType: digitalCard?.codeType || "barcode",
      color: digitalCard?.color,
      note: digitalCard?.note,
    },
  });

  function onSubmit(data: DigitalCardRequest) {
    if (digitalCard) {
      updateMutation.mutate(
        { id: digitalCard.id, data },
        {
          onSuccess: async () => {
            toast.success("Digitalna kartica je uspješno ažurirana!");
            await queryClient.invalidateQueries({
              queryKey: ["digitalCards"],
            });
            onSuccess?.();
            onOpenChange(false);
          },
          onError: (error: any) => {
            form.setError("root", {
              message:
                error.message ||
                "Došlo je do greške prilikom ažuriranja kartice",
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: async () => {
          toast.success("Digitalna kartica je uspješno kreirana!");
          await queryClient.invalidateQueries({
            queryKey: ["digitalCards"],
          });
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (error: any) => {
          form.setError("root", {
            message:
              error.message || "Došlo je do greške prilikom kreiranja kartice",
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
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {digitalCard ? "Uredi digitalnu karticu" : "Nova digitalna kartica"}
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
                  <FormLabel>Naziv kartice</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vrijednost/Kod</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip kartice</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Odaberite tip" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="loyalty">Loyalty kartica</SelectItem>
                        <SelectItem value="discount">Popust kartica</SelectItem>
                        <SelectItem value="membership">Članstvo</SelectItem>
                        <SelectItem value="gift">Poklon kartica</SelectItem>
                        <SelectItem value="other">Ostalo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip koda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Odaberite tip koda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barcode">Barkod</SelectItem>
                        <SelectItem value="qr">QR kod</SelectItem>
                        <SelectItem value="number">Broj</SelectItem>
                        <SelectItem value="text">Tekst</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boja kartice</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      placeholder="#ffffff"
                      {...field}
                      value={field.value || "#ffffff"}
                      className="h-15"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Napomena</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Unesite napomenu"
                      {...field}
                      value={field.value || ""}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    Dodatne informacije o vašoj kartici ({" "}
                    {200 - (field.value?.length || 0)} preostalo).
                  </FormDescription>
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
                {digitalCard ? "Ažuriraj" : "Stvori"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
