import Link from "next/link";
import CartLogo from "@/components/icons/cart-logo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function HeaderBrand() {
  return (
    <div className="flex items-center space-x-2">
      <SidebarTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" />

      <Link href="/" className="flex items-center space-x-2">
        {/* App logo */}
        <CartLogo className="hidden sm:block size-10 sm:size-12 text-primary" />
        <span className="font-saira-stencil-semibold text-2xl sm:text-3xl text-primary">
          disscount
        </span>
      </Link>
    </div>
  );
}
