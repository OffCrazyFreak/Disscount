import Link from "next/link";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { storeNamesMap } from "@/constants/name-mappings";
import { getChainLabel } from "@/utils/labels";

const chains = Object.keys(storeNamesMap);

function LogoRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-4 pr-4"
    >
      {chains.map((chain) => (
        <li key={chain} className="shrink-0">
          <Link
            href={`/products?chain=${chain}`}
            aria-label={`Pogledaj cijene - ${getChainLabel(chain)}`}
            tabIndex={ariaHidden ? -1 : undefined}
            className="grid size-16 sm:size-20 cursor-pointer place-items-center rounded-2xl border bg-white p-2.5 shadow-sm transition-transform hover:scale-105"
          >
            <StoreChainLogo
              chain={chain}
              className="object-contain rounded-lg"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Pure-CSS infinite marquee: the track holds two identical rows and slides by
// -50%; pauses on hover (group/marquee) and stops under reduced motion.
export default function StoresMarquee() {
  return (
    <div className="group/marquee relative overflow-x-clip">
      <div className="flex w-max animate-dis-marquee [--dis-marquee-duration:45s]">
        <LogoRow />
        <LogoRow ariaHidden />
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
