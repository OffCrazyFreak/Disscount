import type { FieldErrors, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { Form } from "@/components/ui/form";
import ShoppingListTitleField from "@/app/[locale]/(user)/shopping-lists/components/forms/shopping-list-title-field";
import type { ShoppingListRequest } from "@/lib/api/types";

interface IShoppingListModalBodyProps {
  loading: boolean;
  loadError: boolean;
  notFound: boolean;
  form: UseFormReturn<ShoppingListRequest>;
  rootError?: FieldErrors<ShoppingListRequest>["root"];
  onSubmit: (data: ShoppingListRequest) => void;
}

export default function ShoppingListModalBody({
  loading,
  loadError,
  notFound,
  form,
  rootError,
  onSubmit,
}: IShoppingListModalBodyProps) {
  const t = useTranslations("shoppingLists");

  if (loading) return <Skeleton className="h-10 w-full" />;

  if (loadError)
    return (
      <p className="text-sm text-muted-foreground">
        {t("listModal.loadError")}
      </p>
    );

  if (notFound)
    return (
      <p className="text-sm text-muted-foreground">{t("modal.notFound")}</p>
    );

  return (
    <Form {...form}>
      <form
        id="shopping-list-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {rootError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {rootError.message}
          </div>
        )}

        <ShoppingListTitleField control={form.control} />
      </form>
    </Form>
  );
}
