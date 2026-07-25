import type { ReactNode } from "react";
import { SquareArrowUp, Plus, EllipsisVertical, Download } from "lucide-react";

const IOS_STEPS: ReactNode[] = [
  <>
    Dodirni gumb <SquareArrowUp className="inline size-5 text-primary" />{" "}
    <span className="font-medium">Podijeli</span> u pregledniku.
  </>,
  <>
    Odaberi <Plus className="inline size-5 text-primary" />{" "}
    <span className="font-medium">Dodaj na početni zaslon</span>.
  </>,
  <>
    Potvrdi s <span className="font-medium">Dodaj</span>.
  </>,
];

const BROWSER_STEPS: ReactNode[] = [
  <>
    Otvori izbornik preglednika{" "}
    <EllipsisVertical className="inline size-5 text-primary" />.
  </>,
  <>
    Odaberi <Download className="inline size-5 text-primary" />{" "}
    <span className="font-medium">Dodaj na početni zaslon</span> (ili{" "}
    <span className="font-medium">Instaliraj aplikaciju</span>).
  </>,
  <>Potvrdi odabir.</>,
];

/** Manual steps, for browsers with no usable install-prompt API. */
export default function installInstructionSteps(isIOS: boolean): ReactNode[] {
  return isIOS ? IOS_STEPS : BROWSER_STEPS;
}
