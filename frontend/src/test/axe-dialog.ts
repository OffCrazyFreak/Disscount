import { configureAxe } from "vi-axe";

// jsdom paints nothing, so contrast cannot be measured. A dialog rendered alone has no page
// landmarks around it, which is the test's doing rather than the app's.
export const axeDialog = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
});
