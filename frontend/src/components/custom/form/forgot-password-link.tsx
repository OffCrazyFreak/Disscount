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
      // aria-disabled rather than the native attribute: a disabled element cannot
      // hold focus, so setting it in the click handler blurred the very control
      // the user had just activated and dropped focus to the body.
      aria-disabled={sending}
      onClick={() => {
        if (sending) return;

        onClick();
      }}
      className="cursor-pointer text-sm text-primary underline hover:text-primary/80 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
    >
      {sending ? "Slanje..." : "Zaboravljena lozinka?"}
    </button>
  );
}
