// Reprocess the source logo into a CLEAN mark for a near-black UI.
// The source is a neon 3D mark on a solid grey card with a soft purple glow.
// Alpha-keying that glow leaves a grainy cloud (glow is as vivid as the mark)
// and punches holes in the dark parts of the "S". Instead we "burn" the flat
// grey background to pure black per-channel: grey -> 0, while the mark and its
// glow stay intact and SMOOTH. No partial-alpha over noise -> no grain. We then
// derive a clean fade-to-transparent from the burned (already grey-free) image,
// so the glow melts into the page instead of sitting in a box.
// Run: node scripts/make-logo.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

const SRC = "C:/Users/MRK/Desktop/solvent logo.png";

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const base = sharp(SRC).ensureAlpha();
const { width, height } = await base.metadata();
const { data } = await base.raw().toBuffer({ resolveWithObject: true });

// Sample the flat grey background from the four corners.
const px = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
};
const corners = [px(4, 4), px(width - 5, 4), px(4, height - 5), px(width - 5, height - 5)];
const bg = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / 4);

const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  // Per-channel "background burn": (c - bg) / (1 - bg), clamped. Sends the flat
  // grey to 0 (black) and rescales everything brighter than it — the mark and
  // its glow survive as a smooth signal, no alpha, no holes.
  const rgb = [0, 1, 2].map((c) => {
    const v = (data[i + c] / 255 - bg[c]) / (1 - bg[c]);
    return Math.min(1, Math.max(0, v));
  });
  const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];

  // Alpha from the burned luminance: background is ~0 -> transparent cleanly,
  // the glow fades smoothly, the mark body is opaque. A gentle gain keeps the
  // mark solid without dragging the faint outer glow back in.
  const a = Math.min(1, smoothstep(0.04, 0.16, lum) * 1.15);

  out[i] = Math.round(rgb[0] * 255);
  out[i + 1] = Math.round(rgb[1] * 255);
  out[i + 2] = Math.round(rgb[2] * 255);
  out[i + 3] = Math.round(a * 255);
}

mkdirSync("public", { recursive: true });

const mark = sharp(out, { raw: { width, height, channels: 4 } })
  .png()
  .trim({ threshold: 10 })
  .modulate({ saturation: 1.1 });
const markBuf = await mark.toBuffer();

// Web logo: high res, single downscale, a little padding so the glow never clips.
await sharp(markBuf)
  .resize(600, 600, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile("public/logo.png");

// Favicons: the same plain mark on transparency (no tile, no added effects).
async function favicon(size, out) {
  await sharp(markBuf)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
}
await favicon(256, "app/icon.png");
await favicon(180, "app/apple-icon.png");

console.log("clean logo + favicons written", { bg: bg.map((v) => Math.round(v * 255)) });
