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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function SelectField({
  name,
  label,
  placeholder,
  options,
}: {
  name: "type" | "codeType";
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const form = useFormContext<DigitalCardRequest>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function DigitalCardFields() {
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

      <SelectField
        name="type"
        label="Tip kartice"
        placeholder="Odaberite tip"
        options={CARD_TYPES}
      />

      <SelectField
        name="codeType"
        label="Tip koda"
        placeholder="Odaberite tip koda"
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
                placeholder="Unesite napomenu"
                {...field}
                value={field.value || ""}
                maxLength={200}
              />
            </FormControl>
            <FormDescription>
              Dodatne informacije o vašoj kartici (
              {200 - (field.value?.length || 0)} preostalo).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
