// Builds src/constants/postcode-counties.json, every Croatian postcode with the
// GeoNames code of its county, from the GeoNames postal code dump (CC BY 4.0,
// credited in the map attribution).
//
// Usage:
//   curl -O https://download.geonames.org/export/zip/HR.zip
//   unzip HR.zip HR.txt
//   node scripts/generate-postcode-counties.mjs HR.txt
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [source] = process.argv.slice(2);
if (!source) {
  console.error("Usage: node scripts/generate-postcode-counties.mjs <HR.txt>");
  process.exit(1);
}

// Columns: country, postal code, place name, admin name1, admin code1, ...
const counts = new Map();
for (const line of readFileSync(source, "utf8").split("\n")) {
  const [country, postcode, , , county] = line.split("\t");
  if (country !== "HR" || !postcode || !county) continue;

  const byCounty = counts.get(postcode) ?? new Map();
  byCounty.set(county, (byCounty.get(county) ?? 0) + 1);
  counts.set(postcode, byCounty);
}

// A postcode whose villages straddle a county line takes the county most of
// them are in.
const counties = Object.fromEntries(
  [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([postcode, byCounty]) => [
      postcode,
      [...byCounty].sort(([, a], [, b]) => b - a)[0][0],
    ]),
);

const target = join("src", "constants", "postcode-counties.json");
writeFileSync(target, `${JSON.stringify(counties, null, 2)}\n`);
console.log(`Wrote ${Object.keys(counties).length} postcodes to ${target}`);
