import { SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stands in for the filter menus while they wait on the URL. h-8 because the real
 * row is a SidebarMenuButton at the default size, not a SidebarMenuSubButton.
 */
export default function SidebarFilterMenuSkeleton({
  count,
}: {
  count: number;
}) {
  return (
    <SidebarMenuSub className="gap-0">
      {Array.from({ length: count }, (_, index) => (
        <SidebarMenuSubItem key={index}>
          <Skeleton className="h-8 w-full" />
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}
