"use client";

import { Loader2, ArrowLeft, Calendar, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { shoppingListService } from "@/lib/api";
import { formatDate } from "@/utils/strings";

export default function ShoppingListDetailClient({
  listId,
}: {
  listId: string;
}) {
  const {
    data: shoppingList,
    isLoading,
    error,
  } = shoppingListService.useGetShoppingListById(listId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="size-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Dohvaćanje popisa za kupnju...</p>
        </div>
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-700 mb-4">
            <h3 className="text-lg font-semibold mb-2">Greška</h3>
            <p>Popis za kupnju nije pronađen ili se dogodila greška.</p>
          </div>
          <Link href="/shopping-lists">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Natrag na popise za kupnju
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = shoppingList.items?.length || 0;
  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/shopping-lists">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Natrag na popise za kupnju
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{shoppingList.title}</h1>
          <div
            title={
              shoppingList.isPublic ? "Popis je javan" : "Popis je privatan"
            }
          >
            {shoppingList.isPublic ? (
              <Globe className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Stvorena: {formatDate(shoppingList.createdAt)}</span>
          </div>
          <div>
            {itemCount} stavki ({checkedCount} završeno)
          </div>
        </div>
      </div>

      {/* AI Prompt */}
      {shoppingList.aiPrompt && (
        <Card className="p-4 mb-6 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">AI Prompt:</h3>
              <p className="text-purple-800">{shoppingList.aiPrompt}</p>
              {shoppingList.aiAnswer && (
                <div className="mt-3 pt-3 border-t border-purple-300">
                  <h4 className="font-medium text-purple-900 mb-1">
                    AI Odgovor:
                  </h4>
                  <p className="text-purple-700 text-sm">
                    {shoppingList.aiAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stavke ({itemCount})</h2>

        {itemCount === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Ovaj popis još nema stavki.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {shoppingList.items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        item.isChecked
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {item.isChecked && "✓"}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          item.isChecked ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {item.name}
                      </p>
                      {item.amount && (
                        <p className="text-sm text-gray-600">
                          Količina: {item.amount}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
