export interface ILabeledSelectOption<TValue extends string = string> {
  value: TValue;
  label: string;
  comingSoon?: boolean;
}
