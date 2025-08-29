"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const [isLoading, setIsLoading] = useState(false);

  const createMutation = digitalCardService.useCreateDigitalCard();
  const updateMutation = digitalCardService.useUpdateDigitalCard();

  const form = useForm<DigitalCardRequest>({
    resolver: zodResolver(digitalCardRequestSchema),
    defaultValues: {
      title: digitalCard?.title || "",
      value: digitalCard?.value || "",
      type: digitalCard?.type || "",
      codeType: digitalCard?.codeType || "",
      color: digitalCard?.color || "",
      note: digitalCard?.note || "",
    },
  });

  const onSubmit = async (data: DigitalCardRequest) => {
    setIsLoading(true);
    try {
      if (isEditing && digitalCard) {
        await updateMutation.mutateAsync({ id: digitalCard.id, data });
        toast.success("Digitalna kartica je uspješno ažurirana!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Digitalna kartica je uspješno kreirana!");
      }
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(
        error.message || "Došlo je do greške prilikom spremanja kartice"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Uredi digitalnu karticu" : "Nova digitalna kartica"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv kartice</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Konzum kartica" {...field} />
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
                    <Input placeholder="Unesite kod kartice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                  <FormLabel>Boja kartice (opcionalno)</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      placeholder="#ffffff"
                      {...field}
                      className="h-10 w-20"
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
                  <FormLabel>Napomena (opcionalno)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dodajte napomenu o kartici..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Spremam..." : isEditing ? "Ažuriraj" : "Stvori"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
