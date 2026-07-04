"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, X, Save } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@daveyplate/better-auth-ui";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  userRequestSchema,
  UserRequest,
  ACQUISITION_CHANNEL_LABELS,
  AcquisitionChannel,
} from "@/lib/api/schemas/auth-user";
import { userService } from "@/lib/api";
import { fileToBase64 } from "@/utils/browser/file";
import { useUser } from "@/context/user-context";

interface IProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_AVATAR_BYTES = 1024 * 1024;

export default function ProfileModal({
  isOpen,
  onOpenChange,
}: IProfileModalProps) {
  const { user, isLoading: isUserLoading, setUser } = useUser();
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");
  const tChannels = useTranslations("acquisitionChannels");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);

  const updateUserMutation = userService.useUpdateCurrentUser();

  const form = useForm<UserRequest>({
    resolver: zodResolver(userRequestSchema),
    defaultValues: {
      username: user?.username ?? undefined,
      notificationsPush: !!user?.notificationsPushEnabledAt,
      notificationsEmail: !!user?.notificationsEmailEnabledAt,
      newsletter: !!user?.newsletterEnabledAt,
      feedbackContact: !!user?.feedbackContactEnabledAt,
      acquisitionChannel: user?.acquisitionChannel ?? undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        username: user?.username ?? undefined,
        notificationsPush: !!user?.notificationsPushEnabledAt,
        notificationsEmail: !!user?.notificationsEmailEnabledAt,
        newsletter: !!user?.newsletterEnabledAt,
        feedbackContact: !!user?.feedbackContactEnabledAt,
        acquisitionChannel: user?.acquisitionChannel ?? undefined,
      });
      setAvatarPreview(user?.image ?? null);
      setAvatarTouched(false);
    }
  }, [isOpen, user, form]);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("avatarTooLarge"));
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
      setAvatarTouched(true);
    } catch {
      toast.error(t("avatarError"));
    }
  }

  function removeAvatar() {
    setAvatarPreview(null);
    setAvatarTouched(true);
  }

  function onSubmit(data: UserRequest) {
    form.clearErrors("root");

    updateUserMutation.mutate(
      {
        username: data.username,
        notificationsPush: data.notificationsPush,
        notificationsEmail: data.notificationsEmail,
        newsletter: data.newsletter,
        feedbackContact: data.feedbackContact,
        acquisitionChannel: data.acquisitionChannel,
        ...(avatarTouched ? { image: avatarPreview ?? "" } : {}),
      },
      {
        onSuccess: (updatedUser) => {
          toast.success(t("saveSuccess"));
          setUser(updatedUser);
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          let status = 0;
          let serverMessage: string | undefined;

          if (isAxiosError(error)) {
            status = error.response?.status ?? 0;
            serverMessage =
              (error.response?.data as { message?: string })?.message ||
              error.message;
          } else {
            serverMessage = (error as Error)?.message || "Unknown error";
          }

          if (status >= 400 && status < 500) {
            form.setError("root", {
              type: "server",
              message: serverMessage || t("checkInput"),
            });
          } else {
            toast.error(serverMessage || t("saveError"));
          }
        },
      }
    );
  }

  const isLoading = updateUserMutation.isPending || isUserLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {form.formState.errors.root && (
              <div
                role="alert"
                aria-live="polite"
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3"
              >
                {form.formState.errors.root.message as string}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("usernameLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>{t("usernameHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>{t("avatarLabel")}</Label>

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
                    {t("uploadImage")}
                  </label>

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={removeAvatar}
                    >
                      <X className="w-4 h-4" />
                      {t("remove")}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500">{t("avatarHint")}</p>
            </div>

            <FormField
              control={form.control}
              name="notificationsPush"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t("pushLabel")}</FormLabel>
                    <FormDescription>{t("pushHint")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notificationsEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t("emailLabel")}</FormLabel>
                    <FormDescription>{t("emailHint")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t("newsletterLabel")}</FormLabel>
                    <FormDescription>{t("newsletterHint")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedbackContact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t("feedbackLabel")}</FormLabel>
                    <FormDescription>{t("feedbackHint")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acquisitionChannel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("acquisitionLabel")}</FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("acquisitionPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.keys(
                          ACQUISITION_CHANNEL_LABELS,
                        ) as AcquisitionChannel[]
                      ).map((value) => (
                        <SelectItem key={value} value={value}>
                          {tChannels(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t("acquisitionHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                effect="ringHover"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>

              <Button
                type="submit"
                variant="default"
                effect="expandIcon"
                icon={Save}
                iconPlacement="right"
                disabled={isLoading}
                loading={updateUserMutation.isPending}
              >
                {tCommon("save")}
              </Button>
            </div>

            <DialogFooter className="text-xs text-gray-500 text-center">
              {t("footer")}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
