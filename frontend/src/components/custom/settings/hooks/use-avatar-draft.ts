import { useState } from "react";

import type { IAvatarChange } from "@/components/custom/settings/settings-save-jobs";
import type { IAvatarSelection } from "@/components/custom/settings/settings-context";

interface IAvatarState {
  initialized: boolean;
  preview: string | null;
  upload: Blob | null;
  touched: boolean;
  version: number;
}

const UNSEEDED: IAvatarState = {
  initialized: false,
  preview: null,
  upload: null,
  touched: false,
  version: 0,
};

/** The avatar picked in settings, held outside the form until Save uploads it. */
export function useAvatarDraft(isReady: boolean, savedImage: string | null) {
  const [avatar, setAvatar] = useState<IAvatarState>(UNSEEDED);

  // Adjust-during-render: seed the avatar from the loaded user exactly once.
  if (isReady && !avatar.initialized) {
    setAvatar(seeded(savedImage, avatar.version));
  }

  const change: IAvatarChange = {
    touched: avatar.touched,
    upload: avatar.upload,
    version: avatar.version,
  };

  function select(selection: IAvatarSelection | null) {
    setAvatar((state) => ({
      ...state,
      preview: selection?.preview ?? null,
      upload: selection?.upload ?? null,
      touched: true,
      version: state.version + 1,
    }));
  }

  function reset() {
    setAvatar((state) => seeded(savedImage, state.version + 1));
  }

  /** Clears only the pick that save sent; a later pick stays touched for the next Save. */
  function markSaved(sent: IAvatarChange) {
    setAvatar((state) =>
      state.version === sent.version
        ? { ...state, upload: null, touched: false }
        : state,
    );
  }

  return {
    preview: avatar.preview,
    touched: avatar.touched,
    change,
    select,
    reset,
    markSaved,
  };
}

function seeded(savedImage: string | null, version: number): IAvatarState {
  return {
    initialized: true,
    preview: savedImage,
    upload: null,
    touched: false,
    version,
  };
}
