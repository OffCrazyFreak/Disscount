import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { productNavItems } from "@/constants/navigation";

/**
 * Stands in for the product nav while it waits on the URL, which it cannot read
 * during a static prerender. Mirrors the real row heights so nothing shifts.
 */
export default function SidebarProductNavSkeleton() {
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>Istraži</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
          {productNavItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <Skeleton className="h-8 w-full" />

              {item.children?.length ? (
                <SidebarMenuSub className="gap-0">
                  {item.children.map((child) => (
                    <SidebarMenuSubItem key={child.id}>
                      <Skeleton className="h-7 w-full" />
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
