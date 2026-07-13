import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const MAP_DIRECTORY = resolve(ROOT, "design/maps/terminal-dashboard");
const MAP_MANIFEST_PATH = resolve(MAP_DIRECTORY, "map.json");
const GENERATED_PATH = resolve(ROOT, "src/game/world/generated/terminalDashboardMap.ts");

type RGB = readonly [number, number, number];
type Bounds = {
  minColumn: number;
  maxColumn: number;
  minRow: number;
  maxRow: number;
};
type Cell = { column: number; row: number };
type Section = {
  id: string;
  label: string;
  bounds: Bounds;
  action: Record<string, string>;
};
type Manifest = {
  name: string;
  version: number;
  width: number;
  height: number;
  tileSize: number;
  elevationStep: number;
  originCell: Cell;
  layers: Record<"surface" | "elevation" | "props" | "zones", string>;
  palettes: Record<"surface" | "elevation" | "props" | "zones", Record<string, string>>;
  nonWalkableSurfaces: string[];
  solidProps: string[];
  anchors: {
    spawn: Cell;
    gardenHeart: Cell;
    systems: Record<string, Cell>;
    labs: Record<string, Cell>;
    bookPickup: Cell;
    libraryDropoff: Cell;
    waterRefill: Cell;
    flowerBeds: Cell[];
  };
  footprints: Record<string, { halfWidthCells: number; halfDepthCells: number }>;
  sections: Section[];
};

type DecodedPng = { width: number; height: number; pixels: Uint8Array };

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(bytes: Uint8Array): number {
  let crc = 0xffff_ffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb8_8320 : 0);
    }
  }
  return (crc ^ 0xffff_ffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const result = new Uint8Array(data.length + 12);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.length);
  result.set(typeBytes, 4);
  result.set(data, 8);
  view.setUint32(data.length + 8, crc32(result.subarray(4, data.length + 8)));
  return result;
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function writePng(path: string, width: number, height: number, pixels: Uint8Array): void {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const scanlines = new Uint8Array(height * (width * 4 + 1));
  for (let row = 0; row < height; row += 1) {
    const target = row * (width * 4 + 1);
    scanlines[target] = 0;
    scanlines.set(pixels.subarray(row * width * 4, (row + 1) * width * 4), target + 1);
  }
  const output = concatBytes([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", new Uint8Array())
  ]);
  writeFileSync(path, output);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function readPng(path: string): DecodedPng {
  const file = new Uint8Array(readFileSync(path));
  if (!PNG_SIGNATURE.every((byte, index) => file[index] === byte)) {
    throw new Error(`${path} is not a PNG file.`);
  }
  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  const idat: Uint8Array[] = [];
  while (offset + 12 <= file.length) {
    const view = new DataView(file.buffer, file.byteOffset + offset);
    const length = view.getUint32(0);
    const type = new TextDecoder().decode(file.subarray(offset + 4, offset + 8));
    const data = file.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = new DataView(file.buffer, file.byteOffset + offset + 8 + length).getUint32(0);
    const actualCrc = crc32(file.subarray(offset + 4, offset + 8 + length));
    if (expectedCrc !== actualCrc) throw new Error(`${path} has an invalid ${type} checksum.`);
    if (type === "IHDR") {
      const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
      width = header.getUint32(0);
      height = header.getUint32(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) {
        throw new Error(`${path} must be a non-interlaced 8-bit RGBA PNG.`);
      }
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }
  if (width <= 0 || height <= 0 || idat.length === 0) throw new Error(`${path} is incomplete.`);
  const source = inflateSync(concatBytes(idat));
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * (stride + 1);
    const filter = source[sourceOffset];
    if (filter > 4) throw new Error(`${path} uses unsupported PNG filter ${filter}.`);
    for (let index = 0; index < stride; index += 1) {
      const raw = source[sourceOffset + 1 + index];
      const target = row * stride + index;
      const left = index >= 4 ? pixels[target - 4] : 0;
      const above = row > 0 ? pixels[target - stride] : 0;
      const upperLeft = row > 0 && index >= 4 ? pixels[target - stride - 4] : 0;
      const predictor = filter === 1
        ? left
        : filter === 2
          ? above
          : filter === 3
            ? Math.floor((left + above) / 2)
            : filter === 4
              ? paeth(left, above, upperLeft)
              : 0;
      pixels[target] = (raw + predictor) & 0xff;
    }
  }
  return { width, height, pixels };
}

function parseHex(hex: string): RGB {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid palette color ${hex}.`);
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function rgbaLayer(width: number, height: number, color: RGB): Uint8Array {
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    pixels.set([...color, 255], index * 4);
  }
  return pixels;
}

function paint(pixels: Uint8Array, width: number, column: number, row: number, color: RGB): void {
  if (column < 0 || row < 0 || column >= width || row >= pixels.length / 4 / width) return;
  pixels.set([...color, 255], (row * width + column) * 4);
}

function fillRect(pixels: Uint8Array, width: number, bounds: Bounds, color: RGB): void {
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
      paint(pixels, width, column, row, color);
    }
  }
}

function borderRect(pixels: Uint8Array, width: number, bounds: Bounds, color: RGB): void {
  for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
    paint(pixels, width, column, bounds.minRow, color);
    paint(pixels, width, column, bounds.maxRow, color);
  }
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    paint(pixels, width, bounds.minColumn, row, color);
    paint(pixels, width, bounds.maxColumn, row, color);
  }
}

const FONT: Readonly<Record<string, readonly string[]>> = {
  A: ["010", "101", "111", "101", "101"], B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"], D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"], F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"], H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"], J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"], L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"], N: ["101", "111", "111", "111", "101"],
  O: ["010", "101", "101", "101", "010"], P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "010", "001"], R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"], T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"], V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"], X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"], Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"], "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"]
};

function drawText(
  pixels: Uint8Array,
  width: number,
  text: string,
  column: number,
  row: number,
  color: RGB,
  scale = 1
): void {
  let cursor = column;
  for (const character of text.toUpperCase()) {
    if (character === " ") {
      cursor += 2 * scale;
      continue;
    }
    const glyph = FONT[character];
    if (!glyph) continue;
    glyph.forEach((line, glyphRow) => {
      [...line].forEach((pixel, glyphColumn) => {
        if (pixel !== "1") return;
        fillRect(pixels, width, {
          minColumn: cursor + glyphColumn * scale,
          maxColumn: cursor + glyphColumn * scale + scale - 1,
          minRow: row + glyphRow * scale,
          maxRow: row + glyphRow * scale + scale - 1
        }, color);
      });
    });
    cursor += 4 * scale;
  }
}

function authoredLayers(manifest: Manifest): Record<"surface" | "elevation" | "props" | "zones", Uint8Array> {
  const color = (layer: keyof Manifest["palettes"], name: string) => parseHex(manifest.palettes[layer][name]);
  const surface = rgbaLayer(manifest.width, manifest.height, color("surface", "void"));
  const elevation = rgbaLayer(manifest.width, manifest.height, color("elevation", "level-0"));
  const props = rgbaLayer(manifest.width, manifest.height, color("props", "none"));
  const zones = rgbaLayer(manifest.width, manifest.height, color("zones", "none"));

  fillRect(surface, manifest.width, { minColumn: 3, maxColumn: 124, minRow: 2, maxRow: 69 }, color("surface", "charcoal"));
  fillRect(surface, manifest.width, { minColumn: 4, maxColumn: 123, minRow: 3, maxRow: 69 }, color("surface", "grass"));

  const panels: readonly [Bounds, string, string][] = [
    [{ minColumn: 6, maxColumn: 121, minRow: 5, maxRow: 10 }, "charcoal", "brass"],
    [{ minColumn: 6, maxColumn: 48, minRow: 13, maxRow: 43 }, "charcoal", "lime"],
    [{ minColumn: 51, maxColumn: 121, minRow: 13, maxRow: 43 }, "grass-mid", "cyan"],
    [{ minColumn: 6, maxColumn: 28, minRow: 46, maxRow: 65 }, "cream", "brass"],
    [{ minColumn: 31, maxColumn: 88, minRow: 46, maxRow: 65 }, "charcoal", "brass"],
    [{ minColumn: 92, maxColumn: 106, minRow: 46, maxRow: 65 }, "soil", "lime"],
    [{ minColumn: 108, maxColumn: 121, minRow: 46, maxRow: 65 }, "charcoal", "brass"],
    [{ minColumn: 6, maxColumn: 121, minRow: 67, maxRow: 68 }, "charcoal", "lime"]
  ];
  for (const [bounds, fill, border] of panels) {
    fillRect(surface, manifest.width, bounds, color("surface", fill));
    borderRect(surface, manifest.width, bounds, color("surface", border));
  }

  const modules: readonly [Bounds, string][] = [
    [{ minColumn: 31, maxColumn: 44, minRow: 52, maxRow: 65 }, "lime"],
    [{ minColumn: 46, maxColumn: 59, minRow: 52, maxRow: 65 }, "brass"],
    [{ minColumn: 61, maxColumn: 74, minRow: 52, maxRow: 65 }, "cyan"],
    [{ minColumn: 76, maxColumn: 88, minRow: 52, maxRow: 65 }, "cream"]
  ];
  for (const [bounds, accent] of modules) {
    fillRect(surface, manifest.width, bounds, color("surface", "stone"));
    borderRect(surface, manifest.width, bounds, color("surface", accent));
  }

  // A topographic garden preview with a shallow river, paths, and cultivation plots.
  for (let row = 14; row <= 42; row += 1) {
    const center = 97 + Math.round(Math.sin(row * 0.47) * 4);
    for (let offset = -1; offset <= 1; offset += 1) paint(surface, manifest.width, center + offset, row, color("surface", "water"));
  }
  fillRect(surface, manifest.width, { minColumn: 101, maxColumn: 118, minRow: 16, maxRow: 23 }, color("surface", "soil"));
  for (let row = 17; row <= 22; row += 2) {
    for (let column = 102; column <= 117; column += 2) paint(props, manifest.width, column, row, color("props", "crops"));
  }
  for (let column = 52; column <= 120; column += 1) paint(surface, manifest.width, column, 38, color("surface", "trail"));
  for (let row = 19; row <= 39; row += 1) paint(surface, manifest.width, 68, row, color("surface", "trail"));

  drawText(surface, manifest.width, "CHAKIB BELGAID", 8, 5, color("surface", "cream"));
  drawText(surface, manifest.width, "BLOG", 77, 5, color("surface", "cyan"));
  drawText(surface, manifest.width, "CONTACT", 94, 5, color("surface", "lime"));
  drawText(surface, manifest.width, "AI", 10, 16, color("surface", "lime"), 2);
  drawText(surface, manifest.width, "SYSTEMS", 10, 29, color("surface", "cyan"));
  drawText(surface, manifest.width, "STATS", 8, 47, color("surface", "charcoal"));
  drawText(surface, manifest.width, "PROJECTS", 34, 46, color("surface", "cream"));
  drawText(surface, manifest.width, "GROW", 93, 47, color("surface", "lime"));
  drawText(surface, manifest.width, "LAB", 94, 56, color("surface", "cream"));
  drawText(surface, manifest.width, "HI", 111, 48, color("surface", "brass"));
  drawText(surface, manifest.width, "DM", 111, 57, color("surface", "cyan"));

  // Elevation is a strict eight-value layer. Panel tops sit one 0.45m step above paths.
  fillRect(elevation, manifest.width, { minColumn: 3, maxColumn: 124, minRow: 2, maxRow: 69 }, color("elevation", "level-1"));
  fillRect(elevation, manifest.width, { minColumn: 4, maxColumn: 123, minRow: 3, maxRow: 69 }, color("elevation", "level-2"));
  for (const [bounds] of panels) fillRect(elevation, manifest.width, bounds, color("elevation", "level-3"));
  for (const [bounds] of modules) fillRect(elevation, manifest.width, bounds, color("elevation", "level-3"));
  for (let row = 14; row <= 42; row += 1) {
    const center = 97 + Math.round(Math.sin(row * 0.47) * 4);
    for (let offset = -1; offset <= 1; offset += 1) paint(elevation, manifest.width, center + offset, row, color("elevation", "level-1"));
  }

  // Landmark-scale props remain sparse enough for third-person navigation.
  for (let column = 8; column <= 120; column += 8) {
    paint(props, manifest.width, column, 3, color("props", "tree"));
    paint(props, manifest.width, column + 3, 69, color("props", "tree"));
  }
  for (const [column, row, name] of [
    [54, 17, "solar"], [57, 17, "solar"], [84, 17, "turbine"], [113, 17, "turbine"],
    [109, 31, "dome"], [116, 35, "dome"], [54, 41, "flowers"], [58, 41, "flowers"],
    [90, 41, "flowers"], [94, 41, "flowers"], [8, 12, "lamp"], [47, 12, "lamp"],
    [52, 12, "lamp"], [120, 12, "lamp"], [7, 45, "lamp"], [120, 45, "lamp"],
    [37, 51, "sign"], [51, 51, "sign"], [66, 51, "sign"], [81, 51, "sign"]
  ] as const) paint(props, manifest.width, column, row, color("props", name));
  for (let column = 52; column <= 120; column += 5) paint(props, manifest.width, column, 43, color("props", "hedge"));

  // Anchors and structure footprints are always free of bitmap props and water.
  const clearAnchor = (cell: Cell, halfWidth: number, halfDepth: number) => {
    for (let row = cell.row - halfDepth; row <= cell.row + halfDepth; row += 1) {
      for (let column = cell.column - halfWidth; column <= cell.column + halfWidth; column += 1) {
        paint(props, manifest.width, column, row, color("props", "none"));
        const pixel = (row * manifest.width + column) * 4;
        const water = color("surface", "water");
        if (surface[pixel] === water[0] && surface[pixel + 1] === water[1] && surface[pixel + 2] === water[2]) {
          paint(surface, manifest.width, column, row, color("surface", "grass-mid"));
          paint(elevation, manifest.width, column, row, color("elevation", "level-2"));
        }
      }
    }
  };
  clearAnchor(manifest.anchors.spawn, 2, 2);
  Object.values(manifest.anchors.systems).forEach((cell) => clearAnchor(cell, 3, 3));
  Object.values(manifest.anchors.labs).forEach((cell) => clearAnchor(cell, 2, 2));
  [manifest.anchors.bookPickup, manifest.anchors.libraryDropoff, manifest.anchors.waterRefill, ...manifest.anchors.flowerBeds]
    .forEach((cell) => clearAnchor(cell, 1, 1));

  for (const section of manifest.sections) {
    fillRect(zones, manifest.width, section.bounds, color("zones", section.id));
  }
  return { surface, elevation, props, zones };
}

function colorKey(r: number, g: number, b: number): string {
  return `${r},${g},${b}`;
}

function compileLayer(name: keyof Manifest["layers"], manifest: Manifest): Uint8Array {
  const png = readPng(resolve(MAP_DIRECTORY, manifest.layers[name]));
  if (png.width !== manifest.width || png.height !== manifest.height) {
    throw new Error(`${name}.png is ${png.width}x${png.height}; expected ${manifest.width}x${manifest.height}.`);
  }
  const entries = Object.entries(manifest.palettes[name]);
  if (entries.length > 255) throw new Error(`${name} palette exceeds the Uint8 layer limit.`);
  const palette = new Map(entries.map(([, hex], code) => {
    const [r, g, b] = parseHex(hex);
    return [colorKey(r, g, b), code];
  }));
  const codes = new Uint8Array(manifest.width * manifest.height);
  for (let index = 0; index < codes.length; index += 1) {
    const offset = index * 4;
    const key = colorKey(png.pixels[offset], png.pixels[offset + 1], png.pixels[offset + 2]);
    const code = palette.get(key);
    if (code === undefined || png.pixels[offset + 3] !== 255) {
      const column = index % manifest.width;
      const row = Math.floor(index / manifest.width);
      throw new Error(`${name}.png contains unknown color rgba(${png.pixels[offset]},${png.pixels[offset + 1]},${png.pixels[offset + 2]},${png.pixels[offset + 3]}) at ${column},${row}.`);
    }
    codes[index] = code;
  }
  return codes;
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return a.minColumn <= b.maxColumn && a.maxColumn >= b.minColumn &&
    a.minRow <= b.maxRow && a.maxRow >= b.minRow;
}

function validateBounds(bounds: Bounds, manifest: Manifest, label: string): void {
  if (!Number.isInteger(bounds.minColumn) || !Number.isInteger(bounds.maxColumn) ||
      !Number.isInteger(bounds.minRow) || !Number.isInteger(bounds.maxRow) ||
      bounds.minColumn < 0 || bounds.minRow < 0 ||
      bounds.maxColumn >= manifest.width || bounds.maxRow >= manifest.height ||
      bounds.minColumn > bounds.maxColumn || bounds.minRow > bounds.maxRow) {
    throw new Error(`${label} has invalid map bounds.`);
  }
}

function validateMap(manifest: Manifest, layers: Record<string, Uint8Array>): void {
  if (manifest.width !== 128 || manifest.height !== 72 || manifest.tileSize !== 2) {
    throw new Error("Terminal dashboard map must remain 128x72 with 2m tiles.");
  }
  const requiredSystems = ["wattch", "whispbook", "agent-commerce", "dev-tools"];
  const requiredLabs = ["helio-metrics", "mossglass", "courier-robotics", "local-systems"];
  for (const key of ["spawn", "gardenHeart", "bookPickup", "libraryDropoff", "waterRefill"] as const) {
    if (!manifest.anchors[key]) throw new Error(`Missing ${key} anchor.`);
  }
  for (const id of requiredSystems) if (!manifest.anchors.systems[id]) throw new Error(`Missing system anchor ${id}.`);
  for (const id of requiredLabs) if (!manifest.anchors.labs[id]) throw new Error(`Missing lab anchor ${id}.`);
  if (manifest.anchors.flowerBeds.length < 3) throw new Error("At least three flower bed anchors are required.");

  const sectionIds = new Set<string>();
  manifest.sections.forEach((section, index) => {
    validateBounds(section.bounds, manifest, `Section ${section.id}`);
    if (sectionIds.has(section.id)) throw new Error(`Duplicate section ${section.id}.`);
    sectionIds.add(section.id);
    if (!(section.id in manifest.palettes.zones)) throw new Error(`Section ${section.id} has no zone color.`);
    for (let other = 0; other < index; other += 1) {
      if (boundsOverlap(section.bounds, manifest.sections[other].bounds)) {
        throw new Error(`Sections ${section.id} and ${manifest.sections[other].id} overlap.`);
      }
    }
    const zoneCode = Object.keys(manifest.palettes.zones).indexOf(section.id);
    for (let row = section.bounds.minRow; row <= section.bounds.maxRow; row += 1) {
      for (let column = section.bounds.minColumn; column <= section.bounds.maxColumn; column += 1) {
        if (layers.zones[row * manifest.width + column] !== zoneCode) {
          throw new Error(`zones.png does not completely fill section ${section.id} at ${column},${row}.`);
        }
      }
    }
  });

  const surfaceNames = Object.keys(manifest.palettes.surface);
  const propNames = Object.keys(manifest.palettes.props);
  const blockedSurfaceCodes = new Set(manifest.nonWalkableSurfaces.map((name) => surfaceNames.indexOf(name)));
  const solidPropCodes = new Set(manifest.solidProps.map((name) => propNames.indexOf(name)));
  if ([...blockedSurfaceCodes, ...solidPropCodes].some((code) => code < 0)) throw new Error("Collision palette references an unknown name.");
  const indexFor = (cell: Cell) => cell.row * manifest.width + cell.column;
  const allAnchors: readonly [string, Cell][] = [
    ["spawn", manifest.anchors.spawn],
    ["gardenHeart", manifest.anchors.gardenHeart],
    ...Object.entries(manifest.anchors.systems).map(([id, cell]) => [`system:${id}`, cell] as [string, Cell]),
    ...Object.entries(manifest.anchors.labs).map(([id, cell]) => [`lab:${id}`, cell] as [string, Cell]),
    ["bookPickup", manifest.anchors.bookPickup],
    ["libraryDropoff", manifest.anchors.libraryDropoff],
    ["waterRefill", manifest.anchors.waterRefill],
    ...manifest.anchors.flowerBeds.map((cell, index) => [`flowerBed:${index}`, cell] as [string, Cell])
  ];
  for (const [name, cell] of allAnchors) {
    validateBounds({ minColumn: cell.column, maxColumn: cell.column, minRow: cell.row, maxRow: cell.row }, manifest, `Anchor ${name}`);
    const index = indexFor(cell);
    if (blockedSurfaceCodes.has(layers.surface[index])) throw new Error(`Anchor ${name} is on a blocked surface.`);
    if (solidPropCodes.has(layers.props[index])) throw new Error(`Anchor ${name} intersects a solid prop.`);
  }

  const validateFootprint = (label: string, cell: Cell, footprint: { halfWidthCells: number; halfDepthCells: number }) => {
    const bounds = {
      minColumn: cell.column - footprint.halfWidthCells,
      maxColumn: cell.column + footprint.halfWidthCells,
      minRow: cell.row - footprint.halfDepthCells,
      maxRow: cell.row + footprint.halfDepthCells
    };
    validateBounds(bounds, manifest, `${label} footprint`);
    for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
      for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
        const index = row * manifest.width + column;
        if (blockedSurfaceCodes.has(layers.surface[index]) || solidPropCodes.has(layers.props[index])) {
          throw new Error(`${label} footprint is obstructed at ${column},${row}.`);
        }
      }
    }
  };
  validateFootprint("spawn", manifest.anchors.spawn, manifest.footprints.spawn);
  Object.entries(manifest.anchors.systems).forEach(([id, cell]) => validateFootprint(`system:${id}`, cell, manifest.footprints.systems));
  Object.entries(manifest.anchors.labs).forEach(([id, cell]) => validateFootprint(`lab:${id}`, cell, manifest.footprints.labs));

  const visited = new Uint8Array(manifest.width * manifest.height);
  const queue = new Int32Array(manifest.width * manifest.height);
  let head = 0;
  let tail = 0;
  const spawnIndex = indexFor(manifest.anchors.spawn);
  visited[spawnIndex] = 1;
  queue[tail++] = spawnIndex;
  while (head < tail) {
    const index = queue[head++];
    const column = index % manifest.width;
    const row = Math.floor(index / manifest.width);
    for (const [nextColumn, nextRow] of [[column - 1, row], [column + 1, row], [column, row - 1], [column, row + 1]]) {
      if (nextColumn < 0 || nextRow < 0 || nextColumn >= manifest.width || nextRow >= manifest.height) continue;
      const next = nextRow * manifest.width + nextColumn;
      if (visited[next] || blockedSurfaceCodes.has(layers.surface[next])) continue;
      visited[next] = 1;
      queue[tail++] = next;
    }
  }
  for (const [name, cell] of allAnchors) {
    if (!visited[indexFor(cell)]) throw new Error(`Anchor ${name} is unreachable from spawn.`);
  }
}

function encodeRle(values: Uint8Array): string {
  const runs: string[] = [];
  for (let start = 0; start < values.length;) {
    const value = values[start];
    let end = start + 1;
    while (end < values.length && values[end] === value && end - start < 1295) end += 1;
    runs.push(`${(end - start).toString(36)}.${value.toString(36)}`);
    start = end;
  }
  return runs.join(",");
}

function worldFor(cell: Cell, manifest: Manifest): { x: number; z: number } {
  return {
    x: (cell.column - manifest.originCell.column) * manifest.tileSize,
    z: (cell.row - manifest.originCell.row) * manifest.tileSize
  };
}

function worldBounds(bounds: Bounds, manifest: Manifest) {
  const min = worldFor({ column: bounds.minColumn, row: bounds.minRow }, manifest);
  const max = worldFor({ column: bounds.maxColumn, row: bounds.maxRow }, manifest);
  const half = manifest.tileSize * 0.5;
  return { minX: min.x - half, maxX: max.x + half, minZ: min.z - half, maxZ: max.z + half };
}

function generateSource(manifest: Manifest, layers: Record<"surface" | "elevation" | "props" | "zones", Uint8Array>): string {
  const bounds = worldBounds({ minColumn: 0, maxColumn: manifest.width - 1, minRow: 0, maxRow: manifest.height - 1 }, manifest);
  const center = { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 };
  const anchors = {
    spawn: worldFor(manifest.anchors.spawn, manifest),
    gardenHeart: worldFor(manifest.anchors.gardenHeart, manifest),
    systems: Object.fromEntries(Object.entries(manifest.anchors.systems).map(([id, cell]) => [id, worldFor(cell, manifest)])),
    labs: Object.fromEntries(Object.entries(manifest.anchors.labs).map(([id, cell]) => [id, worldFor(cell, manifest)])),
    bookPickup: worldFor(manifest.anchors.bookPickup, manifest),
    libraryDropoff: worldFor(manifest.anchors.libraryDropoff, manifest),
    waterRefill: worldFor(manifest.anchors.waterRefill, manifest),
    flowerBeds: manifest.anchors.flowerBeds.map((cell) => worldFor(cell, manifest))
  };
  const sections = manifest.sections.map((section) => ({
    id: section.id,
    label: section.label,
    cellBounds: section.bounds,
    worldBounds: worldBounds(section.bounds, manifest),
    action: section.action
  }));
  const paletteDeclarations = (["surface", "elevation", "props", "zones"] as const)
    .map((layer) => `export const ${layer.toUpperCase()}_NAMES = ${JSON.stringify(Object.keys(manifest.palettes[layer]))} as const;\nexport const ${layer.toUpperCase()}_COLORS = ${JSON.stringify(Object.values(manifest.palettes[layer]))} as const;`)
    .join("\n\n");
  return `/* eslint-disable */\n// Generated by scripts/compile-world-map.ts. Do not edit by hand.\nimport type { WebsiteMapAnchors, WebsiteMapBounds, WebsiteSection } from "../map/schema";\n\nfunction decodeRle(encoded: string, length: number): Uint8Array {\n  const values = new Uint8Array(length);\n  let offset = 0;\n  for (const run of encoded.split(",")) {\n    const [count, value] = run.split(".");\n    const size = Number.parseInt(count, 36);\n    values.fill(Number.parseInt(value, 36), offset, offset + size);\n    offset += size;\n  }\n  if (offset !== length) throw new Error(\`Invalid generated map layer length: \${offset}/\${length}.\`);\n  return values;\n}\n\nexport const TERMINAL_DASHBOARD_MAP_VERSION = ${manifest.version};\nexport const TERMINAL_DASHBOARD_CELL_COUNT = ${manifest.width * manifest.height};\nexport const TERMINAL_DASHBOARD_ELEVATION_STEP = ${manifest.elevationStep};\n\n${paletteDeclarations}\n\nexport const SURFACE_LAYER = decodeRle(${JSON.stringify(encodeRle(layers.surface))}, TERMINAL_DASHBOARD_CELL_COUNT);\nexport const ELEVATION_LAYER = decodeRle(${JSON.stringify(encodeRle(layers.elevation))}, TERMINAL_DASHBOARD_CELL_COUNT);\nexport const PROPS_LAYER = decodeRle(${JSON.stringify(encodeRle(layers.props))}, TERMINAL_DASHBOARD_CELL_COUNT);\nexport const ZONES_LAYER = decodeRle(${JSON.stringify(encodeRle(layers.zones))}, TERMINAL_DASHBOARD_CELL_COUNT);\n\nexport const NON_WALKABLE_SURFACE_CODES = Object.freeze(${JSON.stringify(manifest.nonWalkableSurfaces.map((name) => Object.keys(manifest.palettes.surface).indexOf(name)))});\nexport const SOLID_PROP_CODES = Object.freeze(${JSON.stringify(manifest.solidProps.map((name) => Object.keys(manifest.palettes.props).indexOf(name)))});\n\nexport const WEBSITE_MAP_BOUNDS: Readonly<WebsiteMapBounds> = Object.freeze(${JSON.stringify({ ...bounds, minY: 0, maxY: manifest.elevationStep * 7 + 6, center })});\nexport const WEBSITE_MAP_ANCHORS: Readonly<WebsiteMapAnchors> = Object.freeze(${JSON.stringify(anchors)});\nexport const WEBSITE_SECTIONS: readonly WebsiteSection[] = Object.freeze(${JSON.stringify(sections)});\n`;
}

function main(): void {
  const manifest = JSON.parse(readFileSync(MAP_MANIFEST_PATH, "utf8")) as Manifest;
  const shouldAuthor = process.argv.includes("--author");
  const shouldWrite = process.argv.includes("--write");
  const shouldCheck = process.argv.includes("--check") || (!shouldAuthor && !shouldWrite);
  if (shouldAuthor) {
    const layers = authoredLayers(manifest);
    for (const layer of ["surface", "elevation", "props", "zones"] as const) {
      writePng(resolve(MAP_DIRECTORY, manifest.layers[layer]), manifest.width, manifest.height, layers[layer]);
    }
  }
  const layers = {
    surface: compileLayer("surface", manifest),
    elevation: compileLayer("elevation", manifest),
    props: compileLayer("props", manifest),
    zones: compileLayer("zones", manifest)
  };
  validateMap(manifest, layers);
  const generated = generateSource(manifest, layers);
  if (shouldWrite) writeFileSync(GENERATED_PATH, generated);
  if (shouldCheck) {
    let current = "";
    try {
      current = readFileSync(GENERATED_PATH, "utf8");
    } catch {
      throw new Error("Generated terminal dashboard map is missing. Run bun run map:build.");
    }
    if (current !== generated) throw new Error("Generated terminal dashboard map is stale. Run bun run map:build.");
  }
  console.log(`terminal-dashboard map valid: ${manifest.width}x${manifest.height}, ${manifest.sections.length} sections`);
}

main();
