import localFont from "next/font/local";
import { Huninn } from "next/font/google";

export const huninn = Huninn({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-huninn",
  display: "swap",
});

export const sairaStencil = localFont({
  src: "./Saira_Stencil/static/SairaStencil-SemiBold.ttf",
  weight: "600",
  style: "normal",
  variable: "--font-saira-stencil",
  display: "swap",
});
