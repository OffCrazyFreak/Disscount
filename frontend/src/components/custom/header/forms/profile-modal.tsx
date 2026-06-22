"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, X, Save } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { UserAvatar } from "@daveyplate/better-auth-ui";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { userRequestSchema, UserRequest } from "@/lib/api/schemas/auth-user";
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

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);

  const updateUserMutation = userService.useUpdateCurrentUser();

  const form = useForm<UserRequest>({
    resolver: zodResolver(userRequestSchema),
    defaultValues: {
      username: user?.username ?? undefined,
      notificationsPush: user?.notificationsPush ?? true,
      notificationsEmail: user?.notificationsEmail ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        username: user?.username ?? undefined,
        notificationsPush: user?.notificationsPush ?? true,
        notificationsEmail: user?.notificationsEmail ?? true,
      });
      setAvatarPreview(user?.image ?? null);
      setAvatarTouched(false);
    }
  }, [isOpen, user, form]);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Slika je prevelika. Maksimalna veličina je 1 MB.");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
      setAvatarTouched(true);
    } catch {
      toast.error("Greška pri učitavanju slike.");
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
        ...(avatarTouched ? { image: avatarPreview ?? "" } : {}),
      },
      {
        onSuccess: (updatedUser) => {
          toast.success("Profil uspješno spremljen!");
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
              message: serverMessage || "Provjeri unesene podatke.",
            });
          } else {
            toast.error(serverMessage || "Greška pri spremanju profila");
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
          <DialogTitle className="text-xl">Profil</DialogTitle>
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
                  <FormLabel>Korisničko ime</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>Kako ćemo te zvati?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      onClick={removeAvatar}
                    >
                      <X className="w-4 h-4" />
                      Ukloni
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500">PNG, JPG ili GIF (do 1 MB).</p>
            </div>

            <FormField
              control={form.control}
              name="notificationsPush"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Dopusti obavijesti aplikacije</FormLabel>
                    <FormDescription>
                      Na mobilnu aplikaciju ćeš dobiti obavijesti za akcije o
                      proizvodima koje odabereš.
                    </FormDescription>
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
                    <FormLabel>Dopusti email obavijesti</FormLabel>
                    <FormDescription>
                      Na email ćeš dobiti obavijesti za akcije o proizvodima
                      koje odabereš.
                    </FormDescription>
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

            {/* Coming-soon email features (disabled placeholders) */}
            {[
              {
                label: "Novosti i ažuriranja",
                description: "Povremene novosti o Disscountu na tvoj email.",
              },
              {
                label: "Sniženja s liste praćenja",
                description:
                  "Email kad proizvod s tvoje liste praćenja padne na akciju.",
              },
              {
                label: "Kontakt za povratne informacije",
                description:
                  "Dopusti da ti se javimo za povratne informacije o aplikaciji.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-row items-center justify-between rounded-lg border p-4 opacity-60"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <Badge className="text-[10px]">USKORO</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch checked={false} disabled />
              </div>
            ))}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                effect="ringHover"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Odustani
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
                Spremi
              </Button>
            </div>

            <DialogFooter className="text-xs text-gray-500 text-center">
              Ove podatke možeš kasnije izmijeniti u postavkama računa.
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
