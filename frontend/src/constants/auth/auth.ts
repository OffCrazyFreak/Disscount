// Gated on Meta Business Verification; flip to false once verified and Live to re-enable Facebook.
export const FACEBOOK_COMING_SOON = true;

// Reset and set-password links; the emails quote this, so it lives in one place.
export const RESET_TOKEN_TTL_SECONDS = 60 * 30;

// The email quotes the lifetime and the dialog counts down the resend wait.
export const REAUTH_CODE_TTL_MINUTES = 10;
export const REAUTH_CODE_LENGTH = 6;
export const REAUTH_CODE_RESEND_SECONDS = 60;

// The proxy mints one per call, so this only bounds a token that leaked from the server side.
export const BACKEND_TOKEN_TTL_MINUTES = 2;
