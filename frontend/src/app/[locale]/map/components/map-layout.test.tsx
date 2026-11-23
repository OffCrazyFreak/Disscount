import { ReactNode, useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import MapLayout from "@/app/[locale]/map/components/map-layout";
import MapUnavailable from "@/app/[locale]/map/components/map-unavailable";
import { IMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";
import {
  IListedStore,
  toListedStore,
} from "@/app/[locale]/map/hooks/use-visible-stores";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

// Boundaries the suite cannot run: the session, the App Router, the camera and the WebGL map.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ isAuthenticated: false, isInitializing: false }),
}));
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/map",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
// MapLibre appends its popups to the end of the map's container, after the controls.
const mapDom = vi.hoisted(() => ({ container: null as HTMLElement | null }));
vi.mock("react-map-gl/maplibre", async () => {
  const { createPortal } = await import("react-dom");

  return {
    Popup: ({ children }: { children: ReactNode }) =>
      mapDom.container &&
      createPortal(
        <div className="maplibregl-popup">{children}</div>,
        mapDom.container,
      ),
  };
});
// The real panel needs the whole directory; these rows pick stores the way its list does.
vi.mock("@/app/[locale]/map/components/map-panel", () => ({
  default: ({ model }: { model: IMapViewModel }) => (
    <section id="map-store-list">
      {model.listed.map((row) => (
        <button
          key={row.key}
          type="button"
          onClick={() => model.selectStore(row.key)}
        >
          {row.store.address}
        </button>
      ))}
    </section>
  ),
}));

const placed = toListedStore(
  {
    chain: "konzum",
    code: "1",
    type: null,
    address: "Ilica 1",
    city: "Zagreb",
    zipcode: "10000",
    phone: null,
    lat: 45.81,
    lon: 15.97,
    locationSource: "upstream",
  },
  null,
);

const unplaced = toListedStore(
  { ...placed.store, code: "2", address: "Vlaška 2", lat: null, lon: null },
  null,
);

interface IHarnessProps {
  mapState?: "live" | "loading" | "unavailable";
  initialKey?: string | null;
}

function Harness({ mapState = "live", initialKey = null }: IHarnessProps) {
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const listed: IListedStore[] = [placed, unplaced];

  const model = {
    listed,
    selected: listed.find((row) => row.key === selectedKey) ?? null,
    selectStore: setSelectedKey,
    status: "success",
    geolocation: { status: "idle", locate: vi.fn() },
  } as unknown as IMapViewModel;

  return (
    <SidebarProvider>
      <CameraScannerProvider>
        <MapLayout
          model={model}
          viewArea={null}
          renderMap={(overlay) => {
            if (mapState === "unavailable") {
              return <MapUnavailable message="map unavailable" />;
            }

            // A loading map renders none of its children yet.
            if (mapState === "loading") return <div />;

            return (
              // Children mount once the container exists, as MapLibre's do.
              <div
                ref={(element) => {
                  mapDom.container = element;
                  setMapContainer(element);
                }}
              >
                <button type="button">Zoom in</button>
                {mapContainer && overlay}
              </div>
            );
          }}
          onCoverChange={vi.fn()}
        />
      </CameraScannerProvider>
    </SidebarProvider>
  );
}

// jsdom lays nothing out, so the popover counts its pin as out of view and hides itself.
function findPopover() {
  return screen.findByLabelText("Konzum", { selector: "[role=dialog]" });
}

async function openSearch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("searchbox", { name: "Trgovina, grad ili adresa" }),
  );
  await screen.findByRole("button", { name: "Ilica 1" });
}

describe("MapLayout on desktop", () => {
  beforeEach(() => {
    vi.stubGlobal("innerWidth", 1440);
    // The language switcher reads the session itself: a signed-out answer.
    server.use(
      http.get("*/api/auth/get-session", () => HttpResponse.json(null)),
    );
  });

  it("closes the panel and shows a picked store at its pin, with focus on it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await openSearch(user);
    await user.click(screen.getByRole("button", { name: "Ilica 1" }));

    const popover = await findPopover();
    await waitFor(() => expect(popover).toHaveFocus());
    // The panel fades out before it unmounts.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Vlaška 2" })).toBeNull(),
    );
  });

  it("keeps a store without a pin open in the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await openSearch(user);
    await user.click(screen.getByRole("button", { name: "Vlaška 2" }));

    expect(
      screen.getByRole("button", { name: "Vlaška 2" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

  it("keeps the list open when the map failed, so the store stays readable", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness mapState="unavailable" />);

    await openSearch(user);
    await user.click(screen.getByRole("button", { name: "Ilica 1" }));

    expect(screen.getByRole("button", { name: "Ilica 1" })).toBeInTheDocument();
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

  it("hands focus to the near-me button when Escape closes the popover", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await openSearch(user);
    await user.click(screen.getByRole("button", { name: "Ilica 1" }));
    const popover = await findPopover();
    await waitFor(() => expect(popover).toHaveFocus());

    await user.keyboard("{Escape}");

    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Trgovine blizu mene" }),
    ).toHaveFocus();
  });

  it("leaves focus in the field when the search closes over a store already shown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await openSearch(user);
    await user.click(screen.getByRole("button", { name: "Ilica 1" }));
    await findPopover();

    await openSearch(user);
    await user.keyboard("{Escape}");

    await findPopover();
    expect(
      screen.getByRole("searchbox", { name: "Trgovina, grad ili adresa" }),
    ).toHaveFocus();
  });

  it("does not take focus for a store a shared link opened", async () => {
    renderWithProviders(<Harness initialKey={placed.key} />);

    const popover = await findPopover();

    expect(popover).not.toHaveFocus();
  });

  it("lets Tab leave the store card in page order instead of looping inside it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await openSearch(user);
    await user.click(screen.getByRole("button", { name: "Ilica 1" }));
    const card = await findPopover();
    await waitFor(() => expect(card).toHaveFocus());

    // Through the card's own controls, then out of it.
    for (
      let step = 0;
      step < 20 && card.contains(document.activeElement);
      step++
    ) {
      await user.tab();
    }

    expect(
      screen.getByRole("button", { name: "Trgovine blizu mene" }),
    ).toHaveFocus();
  });

  it("keeps a shared link's list closed while the map is still loading", async () => {
    renderWithProviders(<Harness mapState="loading" initialKey={placed.key} />);

    await screen.findByRole("searchbox", { name: "Trgovina, grad ili adresa" });

    expect(screen.queryByRole("button", { name: "Ilica 1" })).toBeNull();
  });
});
