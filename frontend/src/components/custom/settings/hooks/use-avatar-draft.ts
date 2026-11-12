import { useState } from "react";

import type { IAvatarChange } from "@/components/custom/settings/settings-save-jobs";
import type { IAvatarSelection } from "@/components/custom/settings/settings-context";

interface IAvatarState {
  initialized: boolean;
  preview: string | null;
  upload: Blob | null;
  touched: boolean;
}

const UNSEEDED: IAvatarState = {
  initialized: false,
  preview: null,
  upload: null,
  touched: false,
};

/** The avatar picked in settings, held outside the form until Save uploads it. */
export function useAvatarDraft(isReady: boolean, savedImage: string | null) {
  const [avatar, setAvatar] = useState<IAvatarState>(UNSEEDED);

  // Adjust-during-render: seed the avatar from the loaded user exactly once.
  if (isReady && !avatar.initialized) {
    setAvatar(seeded(savedImage));
  }

  const change: IAvatarChange = {
    touched: avatar.touched,
    upload: avatar.upload,
  };

  function select(selection: IAvatarSelection | null) {
    setAvatar((state) => ({
      ...state,
      preview: selection?.preview ?? null,
      upload: selection?.upload ?? null,
      touched: true,
    }));
  }

  function reset() {
    setAvatar(seeded(savedImage));
  }

  function markSaved() {
    setAvatar((state) => ({ ...state, upload: null, touched: false }));
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

function seeded(savedImage: string | null): IAvatarState {
  return {
    initialized: true,
    preview: savedImage,
    upload: null,
    touched: false,
  };
}
