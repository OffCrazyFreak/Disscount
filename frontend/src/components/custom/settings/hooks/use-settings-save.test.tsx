import { act, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import type { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import type { ISaveJobRunners } from "@/components/custom/settings/settings-save-jobs";
import { useSettingsSave } from "@/components/custom/settings/hooks/use-settings-save";
import { useFormDraft } from "@/hooks/use-form-draft";
import { renderHookWithProviders } from "@/test/render";
import { peekFormDraft } from "@/utils/browser/storage/drafts";

const runners = vi.hoisted(() => ({
  current: {} as ISaveJobRunners,
}));

vi.mock("@/components/custom/settings/hooks/use-settings-save-runners", () => ({
  useSettingsSaveRunners: () => ({ runners: runners.current, saving: false }),
}));

const SAVED: Partial<SettingsFormValues> = {
  username: "ana",
  pinnedStores: [],
  pinnedPlaces: [],
};

async function waitForDraftWrite() {
  // The draft's 500 ms debounce writes the mid-save edit while the save is still running.
  await act(() => new Promise((resolve) => setTimeout(resolve, 700)));
}

function slowRunners() {
  let finishUser: () => void = () => {};
  let failStores: () => void = () => {};
  let finishStores: () => void = () => {};
  let failPlaces: () => void = () => {};

  runners.current = {
    saveUser: () => new Promise<void>((resolve) => (finishUser = resolve)),
    uploadAvatar: async () => {},
    removeAvatar: async () => {},
    saveStores: () =>
      new Promise<void>((resolve, reject) => {
        finishStores = resolve;
        failStores = () => reject(new Error("down"));
      }),
    savePlaces: () =>
      new Promise<void>(
        (_, reject) => (failPlaces = () => reject(new Error("down"))),
      ),
  };

  return {
    finishUser: () => finishUser(),
    failStores: () => failStores(),
    finishStores: () => finishStores(),
    failPlaces: () => failPlaces(),
  };
}

const DRAFT_KEY = "settings-save-test";

// Registered like the profile input; pinned stores are set through setValue only, as in the real grid.
function renderSave() {
  return renderHookWithProviders(() => {
    const form = useForm<SettingsFormValues>({
      defaultValues: SAVED as SettingsFormValues,
    });
    form.register("username");

    const { clearDraft, flushDraft } = useFormDraft({
      draftKey: DRAFT_KEY,
      form,
    });
    const save = useSettingsSave({
      form,
      avatar: { touched: false, upload: null, version: 0 },
      onSaved: vi.fn(),
      clearDraft,
      flushDraft,
    });

    return { form, ...save };
  });
}

describe("useSettingsSave", () => {
  it("keeps a field edited while the save that sent the old value runs", async () => {
    const slow = slowRunners();
    const { result } = renderSave();

    act(() => result.current.form.setValue("username", "ana2"));
    let saved: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saved = result.current.saveSettings();
    });
    act(() => result.current.form.setValue("username", "ana3"));

    await act(async () => {
      slow.finishUser();
      await saved;
    });

    expect(result.current.form.getValues("username")).toBe("ana3");
    await waitFor(() =>
      expect(result.current.form.formState.defaultValues?.username).toBe(
        "ana2",
      ),
    );
  });

  it("keeps a field edited mid-save when another section fails", async () => {
    const slow = slowRunners();
    const { result } = renderSave();

    act(() => {
      result.current.form.setValue("username", "ana2");
      result.current.form.setValue("pinnedStores", ["konzum"]);
    });
    let saved: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saved = result.current.saveSettings();
    });
    act(() => result.current.form.setValue("username", "ana3"));

    await act(async () => {
      slow.finishUser();
      slow.failStores();
      await saved;
    });

    expect(result.current.form.getValues("username")).toBe("ana3");
    expect(result.current.form.formState.defaultValues?.username).toBe("ana2");
  });

  it("rewrites the draft against the saved values, keeping only the later edit", async () => {
    const slow = slowRunners();
    const { result } = renderSave();

    act(() => {
      result.current.form.setValue("username", "ana2");
      result.current.form.setValue("pinnedStores", ["konzum"]);
    });
    let saved: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saved = result.current.saveSettings();
    });
    act(() => result.current.form.setValue("username", "ana3"));
    await waitForDraftWrite();

    await act(async () => {
      slow.finishUser();
      slow.finishStores();
      await saved;
    });

    await waitFor(
      () =>
        expect(peekFormDraft(DRAFT_KEY)?.values).toEqual({ username: "ana3" }),
      { timeout: 2000 },
    );
  });

  it("drops saved stores from the draft when only another section failed", async () => {
    const slow = slowRunners();
    const { result } = renderSave();

    act(() => {
      result.current.form.setValue("pinnedStores", ["konzum"]);
      result.current.form.setValue("pinnedPlaces", ["Zagreb"]);
    });
    let saved: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saved = result.current.saveSettings();
    });
    act(() => result.current.form.setValue("username", "ana3"));
    await waitForDraftWrite();

    await act(async () => {
      slow.finishStores();
      slow.failPlaces();
      await saved;
    });

    expect(peekFormDraft(DRAFT_KEY)?.values).toEqual({
      username: "ana3",
      pinnedPlaces: ["Zagreb"],
    });
  });
});
