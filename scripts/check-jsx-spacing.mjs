#!/usr/bin/env node
/**
 * Guards against a compiler bug that silently eats spaces.
 *
 * The JSX transform drops the leading space of a text node when that node both
 * spans more than one source line and contains an HTML entity. So this:
 *
 *     <p>
 *       {weeks} weeks&rsquo; rent — the most a landlord
 *       can legally take.
 *     </p>
 *
 * renders as "4weeks’ rent". It bites after a closing tag too, so
 * <span>{n}</span> earned... loses its space the same way. Remove the entity
 * and the space comes back;
 * put the text on one line and it comes back. Nothing warns you, and it only
 * shows up if someone reads the rendered page closely — which is how three of
 * these reached the app before anyone noticed.
 *
 * The fix at each site is an explicit {" "} after the expression.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (p.endsWith(".tsx")) files.push(p);
  }
})("src");

const findings = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  // Text sitting between the close of an expression or an element and the
  // next tag or expression — the text node about to lose its space.
  const pattern = /[>}][ \t]+([^<>{}]*?)(?=[<{])/gs;
  for (const match of source.matchAll(pattern)) {
    const text = match[1];
    if (!text.includes("\n")) continue;
    if (!/&[a-zA-Z]+;|&#\d+;/.test(text)) continue;
    findings.push({
      file,
      line: source.slice(0, match.index).split("\n").length,
      text: text.replace(/\s+/g, " ").trim().slice(0, 90),
    });
  }
}

if (findings.length === 0) {
  console.log("jsx spacing: ok");
  process.exit(0);
}

for (const f of findings) {
  console.error(`${f.file}:${f.line}  leading space will be dropped`);
  console.error(`    ...} ${f.text}`);
}
console.error(
  `\n${findings.length} site${findings.length === 1 ? "" : "s"} will render without a space. ` +
    `Put an explicit {" "} after the expression.`
);
process.exit(1);
