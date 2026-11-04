// The same gate CI runs: fallow exits 0 on the "warn" new duplication gets, so the verdict decides.
import { execFileSync } from "node:child_process";

const audit = ["audit", "--base", process.env.FALLOW_AUDIT_BASE ?? "origin/dev"];

execFileSync("fallow", audit, { stdio: "inherit" });

const report = execFileSync("fallow", [...audit, "--quiet", "--format", "json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const { verdict } = JSON.parse(report);

if (verdict !== "pass") {
  console.error(`Fallow audit verdict is ${verdict}; see the report above.`);
  process.exit(1);
}
