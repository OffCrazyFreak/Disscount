import {
  isSettingsTab,
  isWatchTypeParam,
  type ModalTarget,
} from "@/lib/modal/modal-registry";

interface IModalParams {
  sub: string | undefined;
  id: string | null;
  ean: string | null;
  type: string | null;
}

type ModalParser = (params: IModalParams) => ModalTarget | null;

const PLAIN_MODAL_NAMES = [
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "email-verified",
  "email-changed",
  "contact",
  "donate",
] as const;

const SHOPPING_LIST_ID_ACTIONS = ["edit", "share", "copy"] as const;
const DIGITAL_CARD_ID_ACTIONS = ["edit", "view"] as const;

function parseShoppingList({ sub, id }: IModalParams): ModalTarget | null {
  if (sub === "new") return { name: "shopping-list", action: "new" };

  const action = SHOPPING_LIST_ID_ACTIONS.find((value) => value === sub);
  return action && id ? { name: "shopping-list", action, id } : null;
}

function parseDigitalCard({ sub, id }: IModalParams): ModalTarget | null {
  if (sub === "new") return { name: "digital-card", action: "new" };

  const action = DIGITAL_CARD_ID_ACTIONS.find((value) => value === sub);
  return action && id ? { name: "digital-card", action, id } : null;
}

function parseWatchlist({ ean, type }: IModalParams): ModalTarget | null {
  if (!ean) return null;

  const watchType = isWatchTypeParam(type) ? type : undefined;
  return { name: "watchlist", ean, watchType };
}

// A Map, not an object literal, so names like "constructor" never hit the prototype.
const PARSERS = new Map<string, ModalParser>([
  ...PLAIN_MODAL_NAMES.map((name): [string, ModalParser] => [
    name,
    () => ({ name }),
  ]),
  [
    "onboarding",
    ({ sub }) => ({
      name: "onboarding",
      mode: sub === "replay" ? "replay" : "required",
    }),
  ],
  [
    "settings",
    ({ sub }) => ({
      name: "settings",
      tab: sub && isSettingsTab(sub) ? sub : "profil",
    }),
  ],
  ["shopping-list", parseShoppingList],
  ["digital-card", parseDigitalCard],
  [
    "shopping-list-actions",
    ({ id }) => (id ? { name: "shopping-list-actions", id } : null),
  ],
  ["add-to-list", ({ ean }) => (ean ? { name: "add-to-list", ean } : null)],
  [
    "product-actions",
    ({ ean }) => (ean ? { name: "product-actions", ean } : null),
  ],
  ["watchlist", parseWatchlist],
]);

export function parseModalParam(
  searchParams: URLSearchParams,
): ModalTarget | null {
  const modal = searchParams.get("modal");
  if (!modal) return null;

  const [name, sub] = modal.split("/");
  const parser = PARSERS.get(name);
  if (!parser) return null;

  return parser({
    sub,
    id: searchParams.get("id"),
    ean: searchParams.get("ean"),
    type: searchParams.get("type"),
  });
}
