import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const indexPath = join(process.cwd(), "dist", "index.html");
const html = readFileSync(indexPath, "utf8");

const rewritten = html
  .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<script defer src="$1"></script>')
  .replace(/\s+crossorigin/g, "");

writeFileSync(indexPath, rewritten);
