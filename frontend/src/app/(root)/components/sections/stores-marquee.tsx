import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { storeNamesMap } from "@/constants/name-mappings";

const chains = Object.keys(storeNamesMap);

function LogoRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {chains.map((chain) => (
        <li
          key={chain}
          className="size-16 sm:size-20 shrink-0 grid place-items-center bg-white border rounded-2xl shadow-sm p-2.5"
        >
          <StoreChainLogo chain={chain} className="object-contain" />
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

      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
