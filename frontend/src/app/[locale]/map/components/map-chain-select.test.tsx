import { describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({
  onChainsChange: (_chains: string[]) => {},
  selectedChains: [] as string[],
}));
vi.mock("@/components/custom/store-chain/store-chain-multi-select", () => ({
  default: (props: typeof captured) => {
    Object.assign(captured, props);
    return null;
  },
}));

const { default: MapChainSelect } =
  await import("@/app/[locale]/map/components/map-chain-select");
const { ALL_CHAINS } =
  await import("@/app/[locale]/map/hooks/use-map-url-state");
const { renderWithProviders } = await import("@/test/render");

const CHAINS = ["konzum", "lidl", "spar"];

function setup(selected: string[] | typeof ALL_CHAINS = ALL_CHAINS) {
  const onChange = vi.fn();
  renderWithProviders(
    <MapChainSelect chains={CHAINS} selected={selected} onChange={onChange} />,
  );
  return onChange;
}

describe("MapChainSelect", () => {
  it("shows every chain as an empty field", () => {
    setup();
    expect(captured.selectedChains).toEqual([]);
  });

  it("passes a partial pick through", () => {
    const onChange = setup();
    captured.onChainsChange(["lidl"]);
    expect(onChange).toHaveBeenCalledWith(["lidl"]);
  });

  it("turns an empty pick into every chain", () => {
    const onChange = setup(["lidl"]);

    captured.onChainsChange([]);
    expect(onChange).toHaveBeenLastCalledWith(ALL_CHAINS);
  });

  it("keeps a pick of every chain ticked, so select all stays visible", () => {
    const onChange = setup(["lidl"]);

    captured.onChainsChange(["spar", "konzum", "lidl"]);
    expect(onChange).toHaveBeenLastCalledWith(["spar", "konzum", "lidl"]);
  });
});
