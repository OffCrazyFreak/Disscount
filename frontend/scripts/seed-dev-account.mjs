// Fills the dev test account (DEV_ACCOUNT_EMAIL / DEV_ACCOUNT_PASSWORD in .env.local)
// with weeks' worth of realistic data, through the app's own APIs. Idempotent: a rerun
// only adds what is missing, so it never duplicates rows or bumps their timestamps.
// DEV_ACCOUNT_2_EMAIL / DEV_ACCOUNT_2_PASSWORD, when set, add a second account that
// ticks an item on the first one's shared list; without them that step is skipped.
// Both accounts must already exist and be verified; docs/TESTING.md covers that, and the
// optional psql snippet that back-dates the rows, which this script cannot reach.
//
// Usage, from frontend/: node scripts/seed-dev-account.mjs [--base-url https://dev.disscount.me]
// Without --base-url it targets NEXT_PUBLIC_APP_URL. Production is always refused.
import { createHash } from "node:crypto";
import {
  createApi,
  readBaseUrl,
  signIn,
  signOut,
} from "./lib/dev-seed-client.mjs";
import {
  CONTACT_MESSAGES,
  DEVICES,
  DIGITAL_CARDS,
  FAVORITE_STORES,
  PINNED_CHAINS,
  PINNED_PLACES,
  PROFILE,
  SECOND_ACCOUNT,
  SHOPPING_LISTS,
  WATCHLIST,
} from "./lib/dev-seed-data.mjs";
import { avatarDataUri, cardPhoto } from "./lib/dev-seed-images.mjs";
import { seedSecondAccount } from "./lib/dev-seed-second-account.mjs";

const SCRIPT_USER_AGENT = "disscount-seed-dev-account";
const DAY_MS = 24 * 60 * 60 * 1000;

process.loadEnvFile(".env.local");
const credentials = {
  email: process.env.DEV_ACCOUNT_EMAIL,
  password: process.env.DEV_ACCOUNT_PASSWORD,
};
if (!credentials.email || !credentials.password) {
  throw new Error(
    "Set DEV_ACCOUNT_EMAIL and DEV_ACCOUNT_PASSWORD in .env.local.",
  );
}

const secondCredentials = process.env.DEV_ACCOUNT_2_EMAIL &&
  process.env.DEV_ACCOUNT_2_PASSWORD && {
    email: process.env.DEV_ACCOUNT_2_EMAIL,
    password: process.env.DEV_ACCOUNT_2_PASSWORD,
  };

const baseUrl = readBaseUrl(process.argv, process.env);
const created = {};

function count(kind, amount = 1) {
  created[kind] = (created[kind] ?? 0) + amount;
}

function sameSet(left, right) {
  return left.length === right.length && left.every((v) => right.includes(v));
}

// Card ids are client supplied; deriving them from the user keeps reruns on the same rows.
function cardId(userId, slug) {
  const hex = createHash("sha256").update(`${userId}:${slug}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const products = new Map();
async function product(ean) {
  if (!products.has(ean)) {
    const response = await fetch(`${baseUrl}/api/cijene/products/${ean}`);
    if (!response.ok)
      throw new Error(`Product ${ean} answered ${response.status}.`);
    products.set(ean, await response.json());
  }
  return products.get(ean);
}

function chainPrice(found, chain) {
  const row = found.chains.find((c) => c.chain === chain);
  return row ? Number(row.avg_price) : undefined;
}

function averagePrice(found) {
  const prices = found.chains.map((c) => Number(c.avg_price)).filter(Boolean);
  return (
    Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
  );
}

async function seedProfile(api) {
  const me = await api.get("/api/users/me");
  const patch = {};
  if (me.username !== PROFILE.username) patch.username = PROFILE.username;
  if (!me.image) patch.image = await avatarDataUri("DT", "#0B8043");
  if (!me.acquisitionChannel)
    patch.acquisitionChannel = PROFILE.acquisitionChannel;
  if (!me.onboardingCompletedAt)
    patch.onboardingOutcome = PROFILE.onboardingOutcome;
  if (!me.newsletterEnabledAt) patch.newsletter = true;
  if (Object.keys(patch).length === 0) return;

  await api.patch("/api/users/me", patch);
  count("profile updates");
}

async function seedPreferences(api) {
  const stores = await api.get("/api/pinned-stores/me");
  if (
    !sameSet(
      stores.map((s) => s.storeApiId),
      PINNED_CHAINS,
    )
  ) {
    const body = PINNED_CHAINS.map((code) => ({
      storeApiId: code,
      storeName: code,
    }));
    await api.put("/api/pinned-stores/bulk", { stores: body });
    count("pinned stores", PINNED_CHAINS.length);
  }

  const places = await api.get("/api/pinned-places/me");
  if (
    !sameSet(
      places.map((p) => p.placeApiId),
      PINNED_PLACES,
    )
  ) {
    const body = PINNED_PLACES.map((key) => ({
      placeApiId: key,
      placeName: key,
    }));
    await api.put("/api/pinned-places/bulk", { places: body });
    count("pinned places", PINNED_PLACES.length);
  }

  const favorites = await api.get("/api/favorite-stores/me");
  if (
    !sameSet(
      favorites.map((f) => f.storeKey),
      FAVORITE_STORES,
    )
  ) {
    const body = FAVORITE_STORES.map((storeKey) => ({ storeKey }));
    await api.put("/api/favorite-stores/bulk", { stores: body });
    count("favourite stores", FAVORITE_STORES.length);
  }
}

async function seedWatchlist(api) {
  const existing = await api.get("/api/watchlist/me");
  for (const item of WATCHLIST) {
    const isTracked = existing.some(
      (e) => e.productApiId === item.ean && e.watchType === item.watchType,
    );
    if (isTracked) continue;

    await product(item.ean);
    await api.post("/api/watchlist", {
      productApiId: item.ean,
      watchType: item.watchType,
      thresholdValue: item.threshold,
    });
    count("watchlist items");
  }
}

async function itemRequest(item) {
  if (!item.ean) {
    return {
      name: item.name,
      amount: item.amount,
      isChecked: Boolean(item.checkedAt),
    };
  }

  const found = await product(item.ean);
  return {
    ean: found.ean,
    brand: found.brand,
    name: found.name,
    quantity: found.quantity,
    unit: found.unit,
    amount: item.amount,
    avgPrice: averagePrice(found),
    ...(item.checkedAt && {
      isChecked: true,
      chainCode: item.checkedAt,
      storePrice: chainPrice(found, item.checkedAt),
    }),
  };
}

async function seedShoppingLists(api, lists) {
  for (const fixture of SHOPPING_LISTS) {
    let list = lists.find((l) => l.title === fixture.title);
    if (!list) {
      list = await api.post("/api/shopping-lists", {
        title: fixture.title,
        linkAccess: fixture.linkAccess,
      });
      list.items = [];
      count("shopping lists");
    }

    for (const item of fixture.items) {
      const isListed = list.items.some((i) =>
        item.ean ? i.ean === item.ean : i.name === item.name,
      );
      if (isListed) continue;

      await api.post(
        `/api/shopping-lists/${list.id}/items`,
        await itemRequest(item),
      );
      count("shopping list items");
    }
  }
}

async function uploadPhotos(api, id, card, saved) {
  for (const side of ["front", "back"]) {
    if (saved.photos?.some((p) => p.slot === side)) continue;

    const { full, thumb } = await cardPhoto(card, side);
    const form = new FormData();
    form.append(
      "full",
      new Blob([full], { type: "image/jpeg" }),
      `${side}.jpg`,
    );
    form.append(
      "thumb",
      new Blob([thumb], { type: "image/jpeg" }),
      `${side}-thumb.jpg`,
    );
    await api.put(`/api/digital-cards/${id}/photos/${side}`, form);
    count("card photos");
  }
}

async function seedCards(api, userId) {
  const cards = await api.get("/api/digital-cards/me");
  const { photosEnabled } = await api.get("/api/digital-cards/config");
  if (!photosEnabled)
    console.log("Card photos are disabled on this server; skipping them.");

  for (const {
    slug,
    pinned,
    withPhotos,
    usedDaysAgo,
    ...card
  } of DIGITAL_CARDS) {
    const id = cardId(userId, slug);
    let saved = cards.find((c) => c.id === id);
    if (!saved) {
      saved = await api.put(`/api/digital-cards/${id}`, card);
      if (pinned)
        await api.put(`/api/digital-cards/${id}/pin`, { pinned: true });
      const usedAt = new Date(Date.now() - usedDaysAgo * DAY_MS).toISOString();
      await api.post("/api/digital-cards/used", [{ id, usedAt }]);
      count("digital cards");
    }
    if (withPhotos && photosEnabled) await uploadPhotos(api, id, card, saved);
  }
}

// The contact API cannot list a user's own messages, so they go out on the first seed only.
async function seedContactMessages(api) {
  for (const message of CONTACT_MESSAGES) {
    await api.post("/api/contact", {
      email: credentials.email,
      fullName: PROFILE.username,
      ...message,
    });
    count("contact messages");
  }
}

async function seedDevices(api) {
  const sessions = await api.get("/api/account/sessions");
  for (const device of DEVICES) {
    if (sessions.some((s) => s.os === device.os)) continue;

    await signIn(baseUrl, credentials, device.userAgent);
    count("device sessions");
  }
}

const { cookie, userId } = await signIn(
  baseUrl,
  credentials,
  SCRIPT_USER_AGENT,
);
try {
  const api = await createApi(baseUrl, cookie);
  await seedProfile(api);

  const lists = await api.get("/api/shopping-lists/me");
  const isFirstSeed = lists.length === 0;

  await seedPreferences(api);
  await seedWatchlist(api);
  await seedShoppingLists(api, lists);
  await seedCards(api, userId);
  if (isFirstSeed) await seedContactMessages(api);
  await seedDevices(api);

  if (secondCredentials) {
    const seeded = await api.get("/api/shopping-lists/me");
    const shared = seeded.find(
      (l) => l.title === SECOND_ACCOUNT.sharedTick.listTitle,
    );
    await seedSecondAccount(baseUrl, secondCredentials, shared?.id, count);
  } else {
    console.log("DEV_ACCOUNT_2_* not set; skipping the second account.");
  }
} finally {
  await signOut(baseUrl, cookie);
}

console.log(`Seeded ${baseUrl} for user ${userId}.`);
console.log(
  Object.keys(created).length
    ? Object.entries(created)
        .map(([kind, n]) => `  ${kind}: ${n}`)
        .join("\n")
    : "  Nothing to add; the account already holds every seeded item.",
);
