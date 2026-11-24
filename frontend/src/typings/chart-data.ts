export type ChartDataPoint = {
  // YYYY-MM-DD; the chart shell formats it per locale for the axis and the tooltip.
  date: string;
  [chainCode: string]: string | number;
};
