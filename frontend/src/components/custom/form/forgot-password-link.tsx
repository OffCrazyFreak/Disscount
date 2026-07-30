"use client";

interface IForgotPasswordLinkProps {
  onClick: () => void;
  // Only the settings tab sends an email inline; the login modal just switches mode.
  sending?: boolean;
}

// Shared by the login modal and the security tab, so both read as one affordance.
export default function ForgotPasswordLink({
  onClick,
  sending = false,
}: IForgotPasswordLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={sending}
      className="cursor-pointer text-sm text-primary underline hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {sending ? "Slanje..." : "Zaboravljena lozinka?"}
    </button>
  );
}
