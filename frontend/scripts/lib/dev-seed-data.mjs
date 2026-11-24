// What the seeded dev account holds. EANs, chain codes and store codes are real
// cijene-api values, so product pages, price history and the map resolve them.

export const PROFILE = {
  username: "Dev Tester",
  acquisitionChannel: "FRIEND_OR_FAMILY",
  onboardingOutcome: "completed",
};

// Chain codes, as the settings page saves them (storeApiId and storeName alike).
export const PINNED_CHAINS = ["konzum", "lidl", "kaufland", "spar", "plodine"];

// Town keys as the settings page builds them; a plain name when it is unambiguous.
export const PINNED_PLACES = ["Zagreb", "Velika Gorica"];

// `chain:storeCode`, the key the map's favourite button stores.
export const FAVORITE_STORES = [
  "konzum:0001",
  "lidl:135",
  "kaufland:1930",
  "spar:87005",
];

export const WATCHLIST = [
  { ean: "3850354016830", watchType: "ABSOLUTE", threshold: 0.9 },
  { ean: "80135876", watchType: "PERCENTAGE", threshold: 20 },
  { ean: "5449000000286", watchType: "PERCENTAGE", threshold: 15 },
  { ean: "3838471032308", watchType: "ABSOLUTE", threshold: 4.5 },
  { ean: "3858882211550", watchType: "PERCENTAGE", threshold: 25 },
  { ean: "3850131986011", watchType: "ABSOLUTE", threshold: 3.5 },
  { ean: "3859892289652", watchType: "PERCENTAGE", threshold: 30 },
  { ean: "7622202258312", watchType: "PERCENTAGE", threshold: 10 },
  { ean: "3850104051029", watchType: "ABSOLUTE", threshold: 2.2 },
  { ean: "8076800195057", watchType: "PERCENTAGE", threshold: 20 },
  { ean: "3870128017085", watchType: "ABSOLUTE", threshold: 9.99 },
];

// `checkedAt` names the chain the item was ticked at; the price comes from that chain.
export const SHOPPING_LISTS = [
  {
    title: "Tjedna kupovina",
    linkAccess: "SHOP",
    items: [
      { ean: "3850354016830", amount: 4, checkedAt: "konzum" },
      { ean: "4000446001735", amount: 1, checkedAt: "konzum" },
      { ean: "3850354016021", amount: 2, checkedAt: "lidl" },
      { ean: "3850108060102", amount: 1 },
      { ean: "8076800195057", amount: 3 },
      { ean: "3850108057980", amount: 1 },
      { ean: "3850159125034", amount: 2 },
      { ean: "3858884600055", amount: 6 },
      { ean: "3838471032308", amount: 1, checkedAt: "kaufland" },
      { ean: "3850104051029", amount: 1 },
      { name: "Banane", amount: 1 },
      { name: "Rajčice", amount: 1, checkedAt: "plodine" },
    ],
  },
  {
    title: "Roštilj u subotu",
    items: [
      { ean: "3850131986011", amount: 3 },
      { ean: "5449000000286", amount: 2 },
      { ean: "5900259127600", amount: 2 },
      { ean: "3856021306549", amount: 1 },
      { ean: "3850104050565", amount: 2 },
    ],
  },
  {
    title: "Drogerija",
    items: [
      { ean: "3859892289652", amount: 1, checkedAt: "dm" },
      { ean: "3870128017085", amount: 1 },
      { ean: "8718951470583", amount: 1 },
      { ean: "3838824086750", amount: 1, checkedAt: "dm" },
    ],
  },
  {
    title: "Za vikendicu",
    items: [{ ean: "3858882211550", amount: 1 }],
  },
];

// Fake numbers in each chain's real format, so nothing scans as a live card.
export const DIGITAL_CARDS = [
  {
    slug: "konzum-multiplus",
    cardName: "MultiPlus kartica",
    cardType: "loyalty",
    storeName: "Konzum",
    chainCode: "konzum",
    codeValue: "2990000123459",
    codeType: "ean_13",
    cardColor: "#D50000",
    note: "Bodovi se skupljaju i u Konzum klik.",
    pinned: true,
    withPhotos: true,
    usedDaysAgo: 2,
  },
  {
    slug: "lidl-plus",
    cardName: "Lidl Plus",
    cardType: "loyalty",
    storeName: "Lidl",
    chainCode: "lidl",
    codeValue: "LP-0000-4417-2291",
    codeType: "qr_code",
    cardColor: "#3F51B5",
    usedDaysAgo: 6,
  },
  {
    slug: "dm-active-beauty",
    cardName: "dm active beauty",
    cardType: "loyalty",
    storeName: "dm",
    chainCode: "dm",
    codeValue: "3086000077713",
    codeType: "ean_13",
    cardColor: "#3F51B5",
    usedDaysAgo: 15,
  },
];

export const CONTACT_MESSAGES = [
  {
    subject: "Prijedlog: usporedba po kilogramu",
    message:
      "Bilo bi super kad bi se na popisu za kupovinu vidjela i cijena po kilogramu, ne samo po komadu.",
    sourcePath: "/shopping-lists",
  },
  {
    subject: "Krivo ime trgovine",
    message:
      "Kod Spara na Ivana Sibla piše stara adresa, trgovina se preselila preko puta.",
    sourcePath: "/map",
  },
];

// Signed in once each, so the sessions list in settings shows several devices.
export const DEVICES = [
  {
    os: "iOS",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
  },
  {
    os: "Android",
    userAgent:
      "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
  },
  {
    os: "Windows",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0",
  },
];

// The second account opens the first one's link-shared list and ticks an item there,
// so the list shows another person's progress; its own data makes account switching visible.
export const SECOND_ACCOUNT = {
  username: "Dev Tester 2",
  onboardingOutcome: "completed",
  sharedTick: {
    listTitle: "Tjedna kupovina",
    itemName: "Banane",
    chainCode: "konzum",
  },
  list: {
    title: "Kupovina za baku",
    items: ["Kruh", "Mlijeko", "Jabuke", "Kava"],
  },
};
