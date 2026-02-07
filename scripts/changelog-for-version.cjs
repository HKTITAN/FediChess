/**
 * Extract the CHANGELOG section for a given version and write to a file.
 * Usage: node scripts/changelog-for-version.cjs <version> [outputPath]
 * Example: node scripts/changelog-for-version.cjs 0.3.0 release_notes.md
 * Version can be with or without leading 'v' (0.3.0 or v0.3.0).
 */

const fs = require("fs");
const path = require("path");

const version = (process.argv[2] || "").replace(/^v/, "");
const outPath = process.argv[3] || "release_notes.md";

if (!version) {
  console.error("Usage: node changelog-for-version.cjs <version> [outputPath]");
  process.exit(1);
}

const changelogPath = path.join(__dirname, "..", "CHANGELOG.md");
const changelog = fs.readFileSync(changelogPath, "utf8");

const heading = `## [${version}]`;
const start = changelog.indexOf(heading);
if (start === -1) {
  console.error(`Version ${version} not found in CHANGELOG.md`);
  process.exit(1);
}

let end = changelog.indexOf("\n---\n", start);
if (end === -1) end = changelog.indexOf("\n## ", start);
if (end === -1) end = changelog.length;

const section = changelog.slice(start, end).trim();
fs.writeFileSync(outPath, section, "utf8");
console.log(`Wrote ${outPath}`);
