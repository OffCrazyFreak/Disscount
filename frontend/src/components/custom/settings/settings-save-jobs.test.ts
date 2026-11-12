import { describe, expect, it, vi } from "vitest";

import {
  buildModeUserPatch,
  buildSaveJobs,
  type ISaveJobRunners,
} from "@/components/custom/settings/settings-save-jobs";
import type { SettingsFormValues } from "@/components/custom/settings/settings-schema";

const values = { username: "ana" } as SettingsFormValues;

function fakeRunners(): ISaveJobRunners {
  return {
    saveUser: vi.fn().mockResolvedValue(undefined),
    uploadAvatar: vi.fn().mockResolvedValue(undefined),
    removeAvatar: vi.fn().mockResolvedValue(undefined),
    saveStores: vi.fn().mockResolvedValue(undefined),
    savePlaces: vi.fn().mockResolvedValue(undefined),
  };
}

describe("buildSaveJobs", () => {
  it("uploads a new avatar as a Blob in its own job", async () => {
    const runners = fakeRunners();
    const avatar = new Blob(["x"], { type: "image/webp" });

    const jobs = buildSaveJobs(
      values,
      values,
      null,
      { touched: true, upload: avatar, version: 1 },
      runners,
    );
    await Promise.all(jobs.map((job) => job.run()));

    expect(jobs.map((job) => job.key)).toEqual(["avatar"]);
    expect(runners.uploadAvatar).toHaveBeenCalledWith(avatar);
    expect(runners.saveUser).not.toHaveBeenCalled();
  });

  it("removes the avatar when it was cleared", async () => {
    const runners = fakeRunners();

    const jobs = buildSaveJobs(
      values,
      values,
      null,
      { touched: true, upload: null, version: 1 },
      runners,
    );
    await Promise.all(jobs.map((job) => job.run()));

    expect(runners.removeAvatar).toHaveBeenCalledOnce();
  });

  it("leaves the avatar alone when it was not touched", () => {
    const jobs = buildSaveJobs(
      values,
      values,
      null,
      { touched: false, upload: null, version: 1 },
      fakeRunners(),
    );

    expect(jobs).toEqual([]);
  });
});

describe("buildModeUserPatch", () => {
  it("never puts the avatar in the profile patch", () => {
    const patch = buildModeUserPatch("onboarding", values, values);

    expect(patch).not.toHaveProperty("image");
  });

  it("sends no profile patch when only the avatar changed", () => {
    expect(buildModeUserPatch("settings", values, values)).toBeNull();
  });
});
