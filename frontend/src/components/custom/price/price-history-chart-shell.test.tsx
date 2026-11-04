import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Line } from "recharts";
import { describe, expect, it } from "vitest";

import PriceHistoryChartShell from "@/components/custom/price/price-history-chart-shell";
import { ChartTooltipContent } from "@/components/ui/chart";
import type { AppLocale } from "@/i18n/locales";
import { renderWithProviders } from "@/test/render";

const CHART_DATA = [
  { date: "2026-11-03", milk: 1.2 },
  { date: "2026-11-04", milk: 1.3 },
];

function renderChart(locale: AppLocale) {
  return renderWithProviders(
    <PriceHistoryChartShell
      chartData={CHART_DATA}
      chartConfig={{ milk: { label: "Mlijeko" } }}
      yAxisTicks={[1, 2]}
      tooltipContent={<ChartTooltipContent />}
    >
      <Line dataKey="milk" isAnimationActive={false} />
    </PriceHistoryChartShell>,
    { locale },
  );
}

function axisTickLabels(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll(".recharts-xAxis-tick-labels text"),
  ).map((tick) => tick.textContent);
}

describe("PriceHistoryChartShell", () => {
  it.each<[AppLocale, string[]]>([
    ["hr", ["03.11.", "04.11."]],
    ["en", ["3 Nov", "4 Nov"]],
    ["de", ["03.11.", "04.11."]],
    ["it", ["03/11", "04/11"]],
    ["sl", ["03. 11.", "04. 11."]],
  ])("labels the %s axis with the day and month", async (locale, ticks) => {
    const { container } = renderChart(locale);

    await waitFor(() => expect(axisTickLabels(container)).toEqual(ticks));
  });

  it.each<[AppLocale, string]>([
    ["hr", "03.11.2026."],
    ["en", "3 Nov 2026"],
  ])("keeps the year in the %s tooltip", async (locale, label) => {
    const { container } = renderChart(locale);
    await waitFor(() => expect(axisTickLabels(container)).toHaveLength(2));

    fireEvent.mouseMove(container.querySelector(".recharts-wrapper")!, {
      clientX: 80,
      clientY: 50,
    });

    expect(await screen.findByText(label)).toBeInTheDocument();
  });
});
