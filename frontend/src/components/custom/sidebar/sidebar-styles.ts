/**
 * Overrides the size-4 icons baked into SidebarMenuButton, which read too small
 * next to the labels. size-5 matches the text-sm line box, so rows keep their height.
 */
export const SIDEBAR_ICON_CLASS =
  "[&>svg]:size-5 group-data-[collapsible=icon]:p-1!";
