import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAvatarDraft } from "@/components/custom/settings/hooks/use-avatar-draft";

function pick(name: string) {
  return {
    preview: `data:image/webp;base64,${name}`,
    upload: new Blob([name], { type: "image/webp" }),
  };
}

describe("useAvatarDraft", () => {
  it("clears the pick once the save that sent it finishes", () => {
    const { result } = renderHook(() => useAvatarDraft(true, null));
    const first = pick("first");

    act(() => result.current.select(first));
    const sent = result.current.change;
    act(() => result.current.markSaved(sent));

    expect(result.current.touched).toBe(false);
    expect(result.current.change.upload).toBeNull();
  });

  it("keeps a second pick made while the first one was still saving", () => {
    const { result } = renderHook(() => useAvatarDraft(true, null));
    const second = pick("second");

    act(() => result.current.select(pick("first")));
    const sent = result.current.change;
    act(() => result.current.select(second));
    act(() => result.current.markSaved(sent));

    expect(result.current.touched).toBe(true);
    expect(result.current.change.upload).toBe(second.upload);
    expect(result.current.preview).toBe(second.preview);
  });

  it("keeps a removal made while an upload was still saving", () => {
    const { result } = renderHook(() => useAvatarDraft(true, null));

    act(() => result.current.select(pick("first")));
    const sent = result.current.change;
    act(() => result.current.select(null));
    act(() => result.current.markSaved(sent));

    expect(result.current.touched).toBe(true);
    expect(result.current.change.upload).toBeNull();
  });
});
