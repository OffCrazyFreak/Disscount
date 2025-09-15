export type ChartDataPoint = {
  date: string;
  [chainCode: string]: string | number;
};
