"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, HandCoins } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellRingIcon } from "@/components/custom/icons/BellRingIcon";
import { useNotifications } from "@/context/notifications-context";
import { formatQuantity } from "@/utils/strings";

export default function NotificationsDropdown() {
  const { notifications, summary, isLoading, hasNotifications } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellRingIcon size={18} />

          {hasNotifications && (
            <Badge className="absolute -top-1 -right-0.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="max-w-screen sm:max-w-xs">
        {/* Summary section */}
        {hasNotifications && (
          <div className="px-3 py-2 border-b">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <HandCoins className="size-8 hidden sm:block text-green-700" />

                <div>
                  <div className="text-md text-green-700">
                    Ukupna ušteda danas:
                  </div>

                  <div className="text-sm text-green-600">
                    (≥ {summary.totalSavings.toFixed(2)}€ na {summary.itemCount}{" "}
                    {summary.itemCount === 1 ? "proizvod" : "proizvoda"})
                  </div>
                </div>
              </div>

              <span className="text-lg font-bold text-green-700">
                {Math.round(summary.totalSavingsPercentage)}%
              </span>
            </div>
          </div>
        )}

        <div className="max-h-128 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Učitavanje...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Danas nema sniženja na praćenim proizvodima 😔
              </p>

              <Link
                href="/watchlist"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                Dodaj proizvode za praćenje
              </Link>
            </div>
          ) : (
            notifications
              .sort((a, b) => {
                const maxDiscountA = Math.max(
                  ...a.discountedStores.map(
                    (store) => store.discountPercentage,
                  ),
                );
                const maxDiscountB = Math.max(
                  ...b.discountedStores.map(
                    (store) => store.discountPercentage,
                  ),
                );
                return maxDiscountB - maxDiscountA;
              })
              .map((notification) => {
                const formattedQuantity = formatQuantity(
                  notification.productQuantity,
                );
                const quantityWithUnit =
                  formattedQuantity && notification.productUnit
                    ? `${formattedQuantity}${notification.productUnit}`
                    : null;

                return (
                  <Link
                    key={notification.id}
                    href={`/products/${notification.productApiId}`}
                    onClick={() => setIsOpen(false)}
                    className="block p-4 border-b last:border-b-0 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-2">
                        <div>
                          <h4 className="text-sm text text-pretty hover:text-primary transition-colors text-gray-900">
                            {notification.productName}
                            {quantityWithUnit ? ` (${quantityWithUnit})` : ""}
                          </h4>

                          {notification.productBrand && (
                            <p className="text-xs text-gray-600 text-pretty">
                              {notification.productBrand}
                            </p>
                          )}
                        </div>

                        <div className="space-y-0">
                          {notification.discountedStores.map((store) => (
                            <p
                              key={`${notification.id}-${store.chainName}`}
                              className="text-sm first:text-green-700"
                            >
                              {store.chainName} ~{" "}
                              {store.currentPrice.toFixed(2)}€
                              {` (-${store.discountAmount.toFixed(2)}€, ${Math.round(store.discountPercentage)}%)`}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
