import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

interface ManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[];
  readonly isEntry?: boolean;
  readonly src?: string;
}

interface SourceMap {
  readonly sources?: readonly string[];
}

const MAX_RECRUITER_JAVASCRIPT_GZIP = 150 * 1024;
const BANNED_SOURCE_MARKERS = [
  "/node_modules/three/",
  "/node_modules/@react-three/fiber/",
  "/node_modules/@react-three/drei/",
  "/src/game/",
  "/src/audio/AudioManager",
  "/src/App.tsx"
] as const;

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = resolve(workspaceRoot, "dist");
const manifest = JSON.parse(
  await readFile(resolve(distDirectory, ".vite/manifest.json"), "utf8")
) as Record<string, ManifestChunk>;

const entryKey = Object.entries(manifest).find(
  ([key, chunk]) => chunk.isEntry && (chunk.src === "index.html" || key === "index.html")
)?.[0];
if (!entryKey) throw new Error("Vite manifest does not contain the browser index entry.");
const recruiterEntryKey = Object.entries(manifest).find(
  ([key, chunk]) =>
    chunk.src === "src/recruiter/RecruiterRouter.tsx" || key === "src/recruiter/RecruiterRouter.tsx"
)?.[0];
if (!recruiterEntryKey) {
  throw new Error("Vite manifest does not contain the recruiter router entry.");
}

const staticChunkKeys = new Set<string>();
// Include the bootstrap and the recruiter dynamic entry, but deliberately do not
// follow the sibling GardenApp dynamic entry.
const pending = [entryKey, recruiterEntryKey];
while (pending.length > 0) {
  const key = pending.pop();
  if (!key || staticChunkKeys.has(key)) continue;
  staticChunkKeys.add(key);
  for (const dependency of manifest[key]?.imports ?? []) pending.push(dependency);
}

let compressedBytes = 0;
const bannedSources = new Set<string>();
for (const key of staticChunkKeys) {
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Vite manifest references missing static chunk ${key}.`);
  const javascript = await readFile(resolve(distDirectory, chunk.file));
  compressedBytes += gzipSync(javascript).byteLength;

  try {
    const sourceMap = JSON.parse(
      await readFile(resolve(distDirectory, `${chunk.file}.map`), "utf8")
    ) as SourceMap;
    for (const source of sourceMap.sources ?? []) {
      const normalized = source.replaceAll("\\", "/");
      if (BANNED_SOURCE_MARKERS.some((marker) => normalized.includes(marker))) {
        bannedSources.add(normalized);
      }
    }
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
}

if (bannedSources.size > 0) {
  throw new Error(
    `Recruiter entry statically imports garden-only code:\n${[...bannedSources].sort().join("\n")}`
  );
}

if (compressedBytes > MAX_RECRUITER_JAVASCRIPT_GZIP) {
  throw new Error(
    `Recruiter entry is ${Math.ceil(compressedBytes / 1024)} KB gzip; the limit is ${MAX_RECRUITER_JAVASCRIPT_GZIP / 1024} KB.`
  );
}

console.log(
  `Recruiter static graph: ${staticChunkKeys.size} JavaScript chunk(s), ${(
    compressedBytes / 1024
  ).toFixed(1)} KB gzip, no garden/Three/R3F sources.`
);
