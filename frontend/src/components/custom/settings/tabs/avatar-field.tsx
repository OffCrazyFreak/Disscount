"use client";

import { Camera } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@daveyplate/better-auth-ui";

import { fileToBase64 } from "@/utils/browser/file";
import { useUser } from "@/context/user-context";
import { useSettingsUi } from "@/components/custom/settings/settings-context";

const MAX_AVATAR_BYTES = 1024 * 1024;

// Lives outside react-hook-form and outside drafts on purpose: base64 images
// would blow the localStorage quota and don't belong in dirty tracking.
export function AvatarField() {
  const { user } = useUser();
  const { avatarPreview, updateAvatar } = useSettingsUi();

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Slika je prevelika. Maksimalna veličina je 1 MB.");
      return;
    }

    try {
      updateAvatar(await fileToBase64(file));
    } catch {
      toast.error("Greška pri učitavanju slike.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <UserAvatar
          className="size-24 text-2xl font-bold"
          user={{
            name: user?.username || "",
            email: user?.email || "",
            image: avatarPreview,
          }}
          size="xl"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          aria-label="Promijeni sliku"
          className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Camera className="size-4" />
        </label>
      </div>

      {avatarPreview && (
        <button
          type="button"
          onClick={() => updateAvatar(null)}
          className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
        >
          Ukloni sliku
        </button>
      )}

      <p className="text-xs text-muted-foreground">PNG, JPG ili GIF (do 1 MB).</p>
    </div>
  );
}
