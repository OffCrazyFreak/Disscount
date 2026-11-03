import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { useFormDraft } from "@/hooks/use-form-draft";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { getFormDraft, setFormDraft } from "@/utils/browser/local-storage";

const DRAFT_KEY = "test-draft";

interface ITestValues {
  name: string;
}

function renderDraftHook() {
  return renderHook(
    ({ enabled }: { enabled: boolean }) => {
      const form = useForm<ITestValues>({ defaultValues: { name: "" } });
      const draft = useFormDraft({ draftKey: DRAFT_KEY, form, enabled });
      return { form, ...draft };
    },
    { initialProps: { enabled: true } },
  );
}

describe("useFormDraft", () => {
  it("saves the changed values when the modal closes without a submit", () => {
    const { result, rerender } = renderDraftHook();

    act(() => result.current.form.setValue("name", "Mlijeko"));
    rerender({ enabled: false });

    expect(getFormDraft(DRAFT_KEY)?.values).toEqual({ name: "Mlijeko" });
  });

  it("does not bring a cleared draft back when the first close follows a submit", async () => {
    const { result, rerender } = renderDraftHook();

    act(() => result.current.form.setValue("name", "Mlijeko"));
    await act(() =>
      result.current.form.handleSubmit(() => result.current.clearDraft())(),
    );
    rerender({ enabled: false });

    expect(getFormDraft(DRAFT_KEY)).toBeNull();
  });

  it("keeps the draft when an optimistic submit closes the modal mid-request", async () => {
    const { result, rerender } = renderDraftHook();
    let finishRequest!: () => void;
    const request = new Promise<void>((resolve) => (finishRequest = resolve));
    let submit!: Promise<void>;

    act(() => result.current.form.setValue("name", "Mlijeko"));
    act(() => {
      submit = result.current.form.handleSubmit(() => request)();
    });
    rerender({ enabled: false });

    expect(getFormDraft(DRAFT_KEY)?.values).toEqual({ name: "Mlijeko" });

    await act(async () => {
      finishRequest();
      await submit;
    });
  });

  it("restores a draft written while the modal was closed on its next open", () => {
    const { result, rerender } = renderDraftHook();

    rerender({ enabled: false });
    setFormDraft(DRAFT_KEY, { name: "Kruh" });
    rerender({ enabled: true });

    expect(result.current.form.getValues("name")).toBe("Kruh");
  });

  it("does not restore a draft another account left on the device", () => {
    setCacheIdentity("account-a");
    setFormDraft(DRAFT_KEY, { name: "Review Shots" });
    setCacheIdentity("account-b");

    const { result } = renderDraftHook();

    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.restored).toBe(false);
  });

  it("does not save the departing account's values as the next account's draft", () => {
    setCacheIdentity("account-a");
    const { result, unmount } = renderDraftHook();

    act(() => result.current.form.setValue("name", "Review Shots"));
    setCacheIdentity("account-b");
    unmount();

    expect(getFormDraft(DRAFT_KEY)).toBeNull();
  });
});
