// Gated on Meta Business Verification; flip to false once verified and Live to
// re-enable Facebook in both the login modal and linked accounts.
export const FACEBOOK_COMING_SOON = true;

// Reset and set-password links; the emails quote this, so it lives in one place.
export const RESET_TOKEN_TTL_SECONDS = 60 * 30;

// Re-authentication codes for accounts without a password; the email quotes the lifetime
// and the dialog counts down the resend wait.
export const REAUTH_CODE_TTL_MINUTES = 10;
export const REAUTH_CODE_LENGTH = 6;
export const REAUTH_CODE_RESEND_SECONDS = 60;
