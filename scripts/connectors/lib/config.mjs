import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "./env.mjs";

export function loadTeamSources() {
  const path = resolve(REPO_ROOT, "config/team-sources.json");
  return JSON.parse(readFileSync(path, "utf8"));
}
