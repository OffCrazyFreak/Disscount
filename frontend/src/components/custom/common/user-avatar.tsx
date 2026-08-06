"use client";

import { type ComponentPropsWithRef, useState } from "react";
import { cn } from "@/lib/utils";

interface IUserAvatarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface IUserAvatarProps extends ComponentPropsWithRef<"span"> {
  user: IUserAvatarUser;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<IUserAvatarProps["size"]>, string> = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
  xl: "size-12 text-lg",
};

function getInitials({ name, email }: IUserAvatarUser) {
  const source = (name || email || "?").trim();
  const [first, second] = source.split(/\s+/);
  const initials = second ? first[0] + second[0] : source.slice(0, 2);

  return initials.toUpperCase();
}

// A plain <img>, since Radix's Avatar never fires load for instant data-URI images.
export default function UserAvatar({
  user,
  size = "md",
  className,
  ref,
  ...props
}: IUserAvatarProps) {
  // The failed URL, not a boolean: a new avatar URL then stops matching and is
  // retried on its own, without an effect resetting the flag behind it. Cleared on
  // a successful load, so a URL that failed once transiently is retried if the user
  // switches away and back rather than staying on initials for the whole mount.
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const showImage = user.image && user.image !== failedImage;

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-bold uppercase text-foreground",
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {showImage ? (
        /* next/image is not an option here: next.config.ts declares no
           images.remotePatterns, so it would reject the external provider avatar
           URLs outright, and Radix's Avatar never fires load for data-URI images. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image ?? undefined}
          alt={user.name || user.email || "Avatar"}
          onError={() => setFailedImage(user.image ?? null)}
          onLoad={() => setFailedImage(null)}
          className="size-full object-cover"
        />
      ) : (
        getInitials(user)
      )}
    </span>
  );
}
