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

// Renders the avatar image directly instead of through Radix's Avatar. Radix has
// no synchronous fast-path for already-complete images, so data-URI avatars (which
// decode instantly) never fire its load event and stay stuck on the initials
// fallback until an unrelated re-render. A plain <img> paints immediately.
export default function UserAvatar({
  user,
  size = "md",
  className,
  ref,
  ...props
}: IUserAvatarProps) {
  const [hasError, setHasError] = useState(false);

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
