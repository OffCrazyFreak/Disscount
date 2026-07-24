import LogoRow from "@/app/(root)/components/sections/logo-row";

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
