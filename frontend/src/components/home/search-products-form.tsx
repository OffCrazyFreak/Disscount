"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchProductsForm(): React.JSX.Element {
  const router = useRouter();

  const { register, handleSubmit, watch, reset } = useForm<{
    searchQuery: string;
  }>({
    defaultValues: { searchQuery: "" },
  });
  const searchQuery = watch("searchQuery", "");

  const onSubmit = (data: { searchQuery: string }) => {
    const q = data.searchQuery?.trim();
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        type="text"
        placeholder="Pretraži proizvode..."
        {...register("searchQuery")}
        className="p-6 transition-colors"
      />

      <Button
        type="submit"
        size="lg"
        className="cursor-pointer w-full text-lg py-6 bg-primary hover:bg-secondary"
        disabled={!searchQuery.trim()}
      >
        <Search className="size-5 mr-2" />
        Pretraži proizvode
      </Button>
    </form>
  );
}
