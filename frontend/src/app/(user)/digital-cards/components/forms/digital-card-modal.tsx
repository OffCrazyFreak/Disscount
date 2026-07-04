"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface IDigitalCardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
  digitalCard?: DigitalCardDto | null;
}

export default function DigitalCardModal({
  isOpen,
  onOpenChange,
  onSuccess,
  digitalCard,
}: IDigitalCardModalProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("pages.digitalCards.modal");
  const tCommon = useTranslations("common");

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
            toast.success(t("updated"));
            await queryClient.invalidateQueries({
              queryKey: ["digitalCards"],
            });
            await onSuccess?.();
            onOpenChange(false);
          },
          onError: (error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            form.setError("root", {
              message: message || t("updateError"),
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: async () => {
          toast.success(t("created"));
          await queryClient.invalidateQueries({
            queryKey: ["digitalCards"],
          });
          await onSuccess?.();
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          form.setError("root", {
            message: message || t("createError"),
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
            {digitalCard ? t("editTitle") : t("createTitle")}
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
                  <FormLabel>{t("titleLabel")}</FormLabel>
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
                  <FormLabel>{t("valueLabel")}</FormLabel>
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
                    <FormLabel>{t("typeLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("typePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="loyalty">
                          {t("typeLoyalty")}
                        </SelectItem>
                        <SelectItem value="discount">
                          {t("typeDiscount")}
                        </SelectItem>
                        <SelectItem value="membership">
                          {t("typeMembership")}
                        </SelectItem>
                        <SelectItem value="gift">{t("typeGift")}</SelectItem>
                        <SelectItem value="other">{t("typeOther")}</SelectItem>
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
                    <FormLabel>{t("codeTypeLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("codeTypePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barcode">
                          {t("codeBarcode")}
                        </SelectItem>
                        <SelectItem value="qr">{t("codeQr")}</SelectItem>
                        <SelectItem value="number">{t("codeNumber")}</SelectItem>
                        <SelectItem value="text">{t("codeText")}</SelectItem>
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
                  <FormLabel>{t("colorLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      placeholder="#ffffff"
                      {...field}
                      value={field.value || "#ffffff"}
                      className="h-16"
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
                  <FormLabel>{t("noteLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("notePlaceholder")}
                      {...field}
                      value={field.value || ""}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("noteHint", {
                      remaining: 200 - (field.value?.length || 0),
                    })}
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
                {tCommon("cancel")}
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
                {digitalCard ? tCommon("update") : tCommon("create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
