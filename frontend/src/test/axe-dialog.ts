import { configureAxe } from "vi-axe";

// jsdom paints nothing, so contrast cannot be measured; a lone dialog has no landmarks, which is the test's doing.
export const axeDialog = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
});
