export interface IStoreOption {
  // Chain code for an official chain, otherwise the display name.
  value: string;
  label: string;
  chainCode?: string;
  // The "add «typed text»" row for text that matches nothing in the list.
  custom?: boolean;
}

export interface IStoreGroup {
  // Group heading; the custom row's group has none.
  value: string;
  items: IStoreOption[];
}
