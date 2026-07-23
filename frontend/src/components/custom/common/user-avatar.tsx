"use client";

import { type ComponentPropsWithRef, useEffect, useState } from "react";
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
  const [hasError, setHasError] = useState(false);

  // A new avatar URL is a fresh image, so clear any error from the previous one.
  useEffect(() => {
    setHasError(false);
  }, [user.image]);

  const showImage = user.image && !hasError;

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
        <img
          src={user.image ?? undefined}
          alt={user.name || user.email || "Avatar"}
          onError={() => setHasError(true)}
          className="size-full object-cover"
        />
      ) : (
        getInitials(user)
      )}
    </span>
  );
}
