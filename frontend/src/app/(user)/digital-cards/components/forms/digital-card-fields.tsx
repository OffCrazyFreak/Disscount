"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import DigitalCardSelectField from "@/app/(user)/digital-cards/components/forms/digital-card-select-field";
import type { DigitalCardRequest } from "@/lib/api/types";

const CARD_TYPES = [
  { value: "loyalty", label: "Loyalty kartica" },
  { value: "discount", label: "Popust kartica" },
  { value: "membership", label: "Članstvo" },
  { value: "gift", label: "Poklon kartica" },
  { value: "other", label: "Ostalo" },
];

const CODE_TYPES = [
  { value: "barcode", label: "Barkod" },
  { value: "qr", label: "QR kod" },
  { value: "number", label: "Broj" },
  { value: "text", label: "Tekst" },
];

export default function DigitalCardFields() {
  const form = useFormContext<DigitalCardRequest>();

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Naziv kartice</FormLabel>
            <FormControl>
              <Input {...field} autoFocus />
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

      <DigitalCardSelectField
        name="type"
        label="Tip kartice"
        placeholder="Odaberi tip"
        options={CARD_TYPES}
      />

      <DigitalCardSelectField
        name="codeType"
        label="Tip koda"
        placeholder="Odaberi tip koda"
        options={CODE_TYPES}
      />

      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Boja kartice</FormLabel>
            <FormControl>
              <Input
                type="color"
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
            <FormLabel>Napomena</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Unesi napomenu"
                {...field}
                value={field.value || ""}
                maxLength={200}
              />
            </FormControl>
            <FormDescription>
              Dodatne informacije o tvojoj kartici (
              {200 - (field.value?.length || 0)} preostalo).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
