import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { useFormDraft } from "@/hooks/use-form-draft";
import { getFormDraft } from "@/utils/browser/local-storage";

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
});
