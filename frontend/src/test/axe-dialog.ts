import { configureAxe } from "vi-axe";

// jsdom paints nothing, so contrast cannot be measured; a dialog rendered alone has no page landmarks, which is the test's doing.
export const axeDialog = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
});
