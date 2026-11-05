"use client";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  type IProductInfoField,
  useProductInfoFields,
} from "@/app/[locale]/products/hooks/use-product-info-fields";

interface IProductInfoTableProps {
  product: ProductResponse;
}

function renderField(field: IProductInfoField) {
  return (
    <>
      <span className="font-bold">{field.label}</span> {field.value}
    </>
  );
}

/** The product's facts as a plain table, where no photo sits beside them (the modals). */
export default function ProductInfoTable({ product }: IProductInfoTableProps) {
  const { brand, barcode, quantity, prices, unitPrices } =
    useProductInfoFields(product);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
      <table className="w-full text-sm table-fixed">
        <tbody>
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
              {renderField(brand)}
            </td>
            <td className="p-2 flex-1">{renderField(barcode)}</td>
          </tr>

          {quantity && prices && (
            <tr className="flex flex-col sm:table-row border-y">
              <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
                {renderField(quantity)}
              </td>
              <td className="p-2 flex-1">{renderField(prices)}</td>
            </tr>
          )}

          {unitPrices && (
            <tr className="flex flex-col sm:table-row">
              <td className="p-2 flex-1">{renderField(unitPrices)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
