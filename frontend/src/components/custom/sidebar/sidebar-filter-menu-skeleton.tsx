import { SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// h-8 matches SidebarMenuButton, which is what SidebarFilterMenu renders as its trigger.
const FILTER_ROW_HEIGHT = "h-8 w-full";

interface ISidebarFilterMenuSkeletonProps {
  count: number;
}

/** Stands in for the filter menus while they wait on the URL. */
export default function SidebarFilterMenuSkeleton({
  count,
}: ISidebarFilterMenuSkeletonProps) {
  return (
    <SidebarMenuSub className="gap-0">
      {Array.from({ length: count }, (_, index) => (
        <SidebarMenuSubItem key={index}>
          <Skeleton className={FILTER_ROW_HEIGHT} />
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}
