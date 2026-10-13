const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, body: string) => {
    if (body[0] !== "#") return ENTITIES[body] ?? whole;

    const code =
      body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);

    return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
  });
}

const KINDS: Record<string, number> = {
  ThoroughfareName: 1,
  PostalDescriptor: 2,
  AdminUnitName: 3,
};

export const STREET_KIND = 1;

const KIND_SPAN = 1e11;

// Ids are kept as numbers because a substring of a member keeps the whole
// text chunk it was cut from alive, which adds up over 1.7M addresses.
function featureKey(id: string): number | null {
  const [kind, serial] = id.split(".");
  const code = KINDS[kind];

  return code && /^\d+$/.test(serial)
    ? code * KIND_SPAN + Number(serial)
    : null;
}

export function kindOf(key: number): number {
  return Math.floor(key / KIND_SPAN);
}

export function featureId(member: string): number | null {
  const id = /gml:id="([^"]+)"/.exec(member)?.[1];

  return id ? featureKey(id) : null;
}

/** The first geographical name spelling in a name feature. */
export function spellingText(member: string): string | null {
  const text = /<gn:text>([^<]*)<\/gn:text>/.exec(member)?.[1];

  return text ? decodeEntities(text).trim() : null;
}

/** Keys of the features an address points at (see featureKey). */
export function componentRefs(member: string): number[] {
  const keys: number[] = [];

  for (const match of member.matchAll(/<ad:component xlink:href="#([^"]+)"/g)) {
    const key = featureKey(match[1]);

    if (key !== null) keys.push(key);
  }

  return keys;
}

/**
 * The house number with its letter. DGU stores "56A" as two designators, an
 * address number and an extension, so both are joined.
 */
export function houseNumber(member: string): string | null {
  let number: string | null = null;
  let extension = "";

  for (const match of member.matchAll(
    /<ad:LocatorDesignator><ad:designator>([^<]*)<\/ad:designator><ad:type[^>]*\/(\w+)"/g,
  )) {
    if (match[2] === "addressNumber") number ??= match[1];
    else if (match[2] === "addressNumberExtension") extension ||= match[1];
  }

  return number === null ? null : decodeEntities(number + extension);
}

/**
 * The point as [northing, easting]. EPSG:3035 declares latitude-first axis
 * order, so gml:pos lists northing before easting.
 */
export function pointNorthingEasting(member: string): [number, number] | null {
  const pos = /<gml:pos>\s*([-\d.eE+]+)\s+([-\d.eE+]+)\s*<\/gml:pos>/.exec(
    member,
  );

  if (!pos) return null;

  const northing = Number(pos[1]);
  const easting = Number(pos[2]);

  return Number.isFinite(northing) && Number.isFinite(easting)
    ? [northing, easting]
    : null;
}
