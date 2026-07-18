"use client";

import { ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@daveyplate/better-auth-ui";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fileToBase64 } from "@/utils/browser/file";
import { useUser } from "@/context/user-context";
import { useSettingsUi } from "@/components/custom/settings/settings-context";

const MAX_AVATAR_BYTES = 1024 * 1024;

// Lives outside react-hook-form and outside drafts on purpose: base64 images
// would blow the localStorage quota and don't belong in dirty tracking.
export function AvatarField() {
  const { user } = useUser();
  const { avatarPreview, updateAvatar } = useSettingsUi();

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
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
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
        id="avatar-upload"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <label
            htmlFor="avatar-upload"
            aria-label="Promijeni sliku"
            className="relative block size-24 cursor-pointer overflow-hidden rounded-full"
          >
            <UserAvatar
              className="size-24 text-2xl font-bold"
              user={{
                name: user?.username || "",
                email: user?.email || "",
                image: avatarPreview,
              }}
              size="xl"
            />

            <span className="absolute inset-x-0 bottom-0 flex h-[30%] items-center justify-center bg-black/45 text-white">
              <Camera className="size-4" />
            </span>
          </label>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          Promijeni sliku
        </TooltipContent>
      </Tooltip>

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
