"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Paperclip, X, Trash2, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

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
import { authClient } from "@/lib/auth-client";
import { clearAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";

interface IAccountDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountDetailsModal({
  isOpen,
  onOpenChange,
}: IAccountDetailsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, isLoading: isUserLoading, setUser } = useUser();
  const queryClient = useQueryClient();

  const updateUserMutation = userService.useUpdateCurrentUser();

  const form = useForm<UserRequest>({
    resolver: zodResolver(userRequestSchema),
    defaultValues: {
      username: user?.username ?? undefined,
      notificationsPush: user?.notificationsPush ?? true,
      notificationsEmail: user?.notificationsEmail ?? true,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => setSelectedFile(null);

  function onSubmit(data: UserRequest) {
    form.clearErrors("root");
    updateUserMutation.mutate(
      {
        username: data.username,
        notificationsPush: data.notificationsPush,
        notificationsEmail: data.notificationsEmail,
      },
      {
        onSuccess: (updatedUser) => {
          toast.success("Detalji računa uspješno spremljeni!");
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
            toast.error(serverMessage || "Greška pri spremanju detalja");
          }
        },
      }
    );
  }

  async function handleLogoutAll() {
    if (!confirm("Jeste li sigurni da se želite odjaviti sa svih uređaja?"))
      return;

    setIsRevoking(true);
    try {
      await authClient.revokeOtherSessions();
      toast.success("Odjavljen si sa svih ostalih uređaja!");
      onOpenChange(false);
    } catch {
      toast.error("Greška pri odjavi sa svih uređaja");
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleDeleteUser() {
    if (
      !confirm(
        "Jeste li sigurni da želite obrisati svoj račun? Ova akcija se ne može poništiti."
      )
    )
      return;

    setIsDeleting(true);
    try {
      // 1. Backend anonymizes the profile row (nulls email/username, sets deletedAt)
      await userService.deleteCurrentUser();

      // 2. Remove the better-auth identity (cascades session/account rows)
      await authClient.deleteUser();

      // 3. Clear local state
      clearAuthToken();
      queryClient.clear();
      setUser(null);

      toast.success("Račun je uspješno obrisan!");
      onOpenChange(false);
    } catch {
      toast.error("Greška pri brisanju računa");
    } finally {
      setIsDeleting(false);
    }
  }

  const isLoading =
    updateUserMutation.isPending || isRevoking || isDeleting || isUserLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Račun</DialogTitle>
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
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center justify-center flex-col p-8 w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <CloudUpload className="text-gray-500 w-10 h-10 mb-2" />
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold">
                        Kliknite za učitavanje
                      </span>{" "}
                      ili povucite sliku
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG ili GIF</p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Odaberi sliku za svoj avatar.
              </p>
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

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-900">
                Sigurnosne opcije
              </h3>

              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  onClick={handleLogoutAll}
                  variant="outline"
                  icon={LogOut}
                  iconPlacement="left"
                  loading={isRevoking}
                >
                  Odjavi se sa svih uređaja
                </Button>

                <Button
                  type="button"
                  onClick={handleDeleteUser}
                  variant="destructive"
                  icon={Trash2}
                  iconPlacement="left"
                  loading={isDeleting}
                >
                  Obriši račun
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                effect={"ringHover"}
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
