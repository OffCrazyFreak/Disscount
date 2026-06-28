// Facebook public login is gated on Meta Business Verification. While that's pending we show
// Facebook as "uskoro" (coming soon) and disable it across the auth UI (login modal + linked
// accounts). Flip this to `false` once the Meta app is verified and Live to re-enable it
// everywhere at once.
export const FACEBOOK_COMING_SOON = true;
