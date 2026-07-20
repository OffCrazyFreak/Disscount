"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContactMessageRequest } from "@/lib/api/types";

const MESSAGE_MAX = 5000;

export default function ContactFormFields() {
  const form = useFormContext<ContactMessageRequest>();

  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="tvoj@email.com"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ime i prezime</FormLabel>
            <FormControl>
              <Input
                placeholder="Tvoje ime"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Naslov <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Npr. Pitanje o Disscountu"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Poruka <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                maxLength={MESSAGE_MAX}
                placeholder="Napiši nam kako ti možemo pomoći..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              {MESSAGE_MAX - (field.value?.length ?? 0)} znakova preostalo
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Honeypot: hidden from users; bot submissions that fill it are dropped. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        {...form.register("honeypot")}
      />
    </>
  );
}
