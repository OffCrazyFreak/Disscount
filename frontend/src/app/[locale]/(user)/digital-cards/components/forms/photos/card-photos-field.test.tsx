import { screen } from "@testing-library/react";
import { delay } from "msw";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import CardPhotosField from "@/app/[locale]/(user)/digital-cards/components/forms/photos/card-photos-field";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const CONFIG_URL = "*/api/digital-cards/config";

function renderField() {
  return renderWithProviders(
    <CardPhotosField
      cardId="card-1"
      card={null}
      changes={{}}
      status={{}}
      onChange={() => {}}
    />,
  );
}

describe("CardPhotosField", () => {
  it("shows the picker once the server confirms photos are on", async () => {
    server.use(
      http.get(CONFIG_URL, () => HttpResponse.json({ photosEnabled: true })),
    );

    renderField();

    expect(await screen.findByRole("group", { name: "Slike" })).toBeVisible();
  });

  it("stays hidden while the config is still loading", async () => {
    server.use(
      http.get(CONFIG_URL, async () => {
        await delay("infinite");
        return HttpResponse.json({ photosEnabled: true });
      }),
    );

    const { container } = renderField();

    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden when the config request fails", async () => {
    let answered = false;
    server.use(
      http.get(CONFIG_URL, () => {
        answered = true;
        return HttpResponse.json({ status: 503 }, { status: 503 });
      }),
    );

    const { container } = renderField();

    await vi.waitFor(() => expect(answered).toBe(true));
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden when photo storage is off", async () => {
    let answered = false;
    server.use(
      http.get(CONFIG_URL, () => {
        answered = true;
        return HttpResponse.json({ photosEnabled: false });
      }),
    );

    const { container } = renderField();

    await vi.waitFor(() => expect(answered).toBe(true));
    expect(container).toBeEmptyDOMElement();
  });
});
