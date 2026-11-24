// The second dev account's part of the seed: a short profile, one list of its own,
// and a tick on the first account's link-shared list, all idempotent like the rest.
import { createApi, signIn, signOut } from "./dev-seed-client.mjs";
import { SECOND_ACCOUNT } from "./dev-seed-data.mjs";

async function seedProfile(api) {
  const me = await api.get("/api/users/me");
  const patch = {};
  if (me.username !== SECOND_ACCOUNT.username)
    patch.username = SECOND_ACCOUNT.username;
  if (!me.onboardingCompletedAt)
    patch.onboardingOutcome = SECOND_ACCOUNT.onboardingOutcome;
  if (Object.keys(patch).length) await api.patch("/api/users/me", patch);
}

async function seedOwnList(api, count) {
  const { title, items } = SECOND_ACCOUNT.list;
  const lists = await api.get("/api/shopping-lists/me");
  let list = lists.find((l) => l.title === title);
  if (!list) {
    list = { ...(await api.post("/api/shopping-lists", { title })), items: [] };
    count("second account lists");
  }

  for (const name of items) {
    if (list.items.some((i) => i.name === name)) continue;
    await api.post(`/api/shopping-lists/${list.id}/items`, { name, amount: 1 });
    count("second account list items");
  }
}

// A link visitor at SHOP level may tick an item; the full item goes back because the update is a PUT.
async function tickSharedItem(api, sharedListId, count) {
  const { itemName, chainCode } = SECOND_ACCOUNT.sharedTick;
  const list = await api.get(`/api/shopping-lists/${sharedListId}`);
  const item = list.items.find((i) => i.name === itemName);
  if (!item || item.isChecked) return;

  const { ean, brand, name, quantity, unit, amount, avgPrice } = item;
  await api.put(`/api/shopping-lists/${sharedListId}/items/${item.id}`, {
    ean,
    brand,
    name,
    quantity,
    unit,
    amount,
    avgPrice,
    isChecked: true,
    chainCode,
  });
  count("ticks on the shared list");
}

export async function seedSecondAccount(
  baseUrl,
  credentials,
  sharedListId,
  count,
) {
  const { cookie } = await signIn(
    baseUrl,
    credentials,
    "disscount-seed-dev-account",
  );
  try {
    const api = await createApi(baseUrl, cookie);
    await seedProfile(api);
    await seedOwnList(api, count);
    if (sharedListId) await tickSharedItem(api, sharedListId, count);
  } finally {
    await signOut(baseUrl, cookie);
  }
}
