"use client";

import React from "react";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getMinPrice,
  getMaxPrice,
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getAveragePricePerUnit,
} from "@/app/products/utils/product-utils";
import { formatQuantity } from "@/utils/strings";

interface IProductInfoTableProps {
  product: ProductResponse;
}

export default function ProductInfoTable({ product }: IProductInfoTableProps) {
  const averagePrice = getAveragePrice(product);
  const minPrice = getMinPrice(product);
  const maxPrice = getMaxPrice(product);

  const minPricePerUnit = getMinPricePerUnit(product);
  const maxPricePerUnit = getMaxPricePerUnit(product);
  const averagePricePerUnit = getAveragePricePerUnit(product);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
      <table className="w-full text-sm table-fixed">
        <tbody>
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
              <span className="font-bold">Proizvođač: </span>
              {product.brand || "Nepoznato"}
            </td>
            <td className="p-2 flex-1">
              <span className="font-bold">Bar kod: </span>
              {product.ean || "Nepoznato"}
            </td>
          </tr>

          {product.quantity && product.unit && (
            <tr className="flex flex-col sm:table-row border-y">
              <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
                <span className="font-bold">Količina: </span>
                {`${formatQuantity(product.quantity)} ${product.unit}`}
              </td>
              <td className="p-2 flex-1">
                <span className="font-bold">Cijene: </span>
                {product.chains.length > 0 ? (
                  <span className="whitespace-nowrap">
                    <span className="text-green-700">
                      {minPrice.toFixed(2)}€
                    </span>
                    <span className="text-gray-700">
                      {" "}
                      | {averagePrice?.toFixed(2)}€ |{" "}
                    </span>
                    <span className="text-red-700">{maxPrice.toFixed(2)}€</span>
                  </span>
                ) : (
                  "Nepoznato"
                )}
              </td>
            </tr>
          )}

          {product.chains.length > 0 && product.quantity && (
            <tr className="flex flex-col sm:table-row">
              <td className="p-2 flex-1">
                <span className="font-bold">Jed. cijene: </span>
                <span className="whitespace-nowrap">
                  <span className="text-green-700">
                    {minPricePerUnit?.toFixed(2)}€/{product.unit}
                  </span>
                  <span className="text-gray-700">
                    {" "}
                    | {averagePricePerUnit?.toFixed(2)}€/{product.unit} |{" "}
                  </span>
                  <span className="text-red-700">
                    {maxPricePerUnit?.toFixed(2)}€/{product.unit}
                  </span>
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
