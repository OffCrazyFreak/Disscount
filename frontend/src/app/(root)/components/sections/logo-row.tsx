import Link from "next/link";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { storeNamesMap } from "@/constants/name-mappings";
import { getChainLabel } from "@/utils/labels";

const chains = Object.keys(storeNamesMap);

interface ILogoRowProps {
  ariaHidden?: boolean;
}

export default function LogoRow({ ariaHidden = false }: ILogoRowProps) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-2 sm:gap-6 pr-2 sm:pr-6"
    >
      {chains.map((chain) => (
        <li key={chain} className="shrink-0">
          <Link
            href={`/products?chain=${chain}`}
            aria-label={`Pogledaj cijene - ${getChainLabel(chain)}`}
            tabIndex={ariaHidden ? -1 : undefined}
            className="grid size-20 sm:size-24 cursor-pointer place-items-center rounded-2xl border bg-white p-1.5 shadow-sm transition-transform hover:scale-105"
          >
            <StoreChainLogo
              chain={chain}
              className="object-contain rounded-md"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
