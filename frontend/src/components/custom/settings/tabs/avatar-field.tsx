"use client";

import { CloudUpload, X } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@daveyplate/better-auth-ui";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-3">
      <Label>Avatar (opcionalno)</Label>

      <div className="flex items-center gap-4">
        <UserAvatar
          className="size-16 text-lg font-bold"
          user={{
            name: user?.username || "",
            email: user?.email || "",
            image: avatarPreview,
          }}
          size="xl"
        />

        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <CloudUpload className="w-4 h-4" />
            Učitaj sliku
          </label>

          {avatarPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-destructive hover:text-destructive"
              onClick={() => updateAvatar(null)}
            >
              <X className="w-4 h-4" />
              Ukloni
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">PNG, JPG ili GIF (do 1 MB).</p>
    </div>
  );
}
