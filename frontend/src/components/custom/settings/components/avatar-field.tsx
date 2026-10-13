"use client";

import { ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import UserAvatar from "@/components/custom/common/user-avatar";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import resizeImageToWebp from "@/utils/browser/image";
import { useUser } from "@/context/user-context";
import { useSettingsUi } from "@/components/custom/settings/settings-context";

// Only guards decoding: the WebP re-encode below sets the stored size.
const MAX_AVATAR_BYTES = 15 * 1024 * 1024;

// Outside react-hook-form and drafts on purpose: base64 images would blow the
// localStorage quota and don't belong in dirty tracking.
export default function AvatarField() {
  const t = useTranslations("settings");
  const { user } = useUser();
  const { avatarPreview, updateAvatar } = useSettingsUi();

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("profile.avatar.tooLarge"));
      return;
    }

    try {
      updateAvatar(await resizeImageToWebp(file));
    } catch {
      toast.error(t("profile.avatar.loadFailed"));
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
            aria-label={t("profile.avatar.change")}
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
          {t("profile.avatar.change")}
        </TooltipContent>
      </Tooltip>

      {avatarPreview && (
        <button
          type="button"
          onClick={() => updateAvatar(null)}
          className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
        >
          {t("profile.avatar.remove")}
        </button>
      )}

      <p className="text-xs text-muted-foreground">
        {t("profile.avatar.formats")}
      </p>
    </div>
  );
}
