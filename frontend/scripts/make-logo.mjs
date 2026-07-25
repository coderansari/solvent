// Use the source logo AS IS — same colors, same glow — and remove ONLY the
// flat grey background so there's no grey box behind it. This is a difference
// matte against the known background: estimate how much each pixel differs
// from the grey, use that as alpha, and un-mix the grey from partial pixels so
// the recovered glow color is clean over any background (no grey tint, no
// grain, no holes). Nothing else about the logo is changed.
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

// Flat grey background, sampled from the four corners (0..1 per channel).
const px = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
};
const corners = [px(4, 4), px(width - 5, 4), px(4, height - 5), px(width - 5, height - 5)];
const bg = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / 4);

const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  const c = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
  // Colour distance from the grey background -> alpha. Grey -> 0 (transparent),
  // glow -> partial (fades naturally), mark -> opaque. Smooth ramp, no hard
  // cut, so there's no grain.
  const dc = Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]);
  const a = smoothstep(0.05, 0.34, dc);

  // Un-mix the grey from partial pixels: fg = (observed - (1-a)*bg) / a. This
  // recovers the true glow/mark colour so it stays clean over the dark UI
  // instead of carrying a muddy grey tint.
  const fg = a > 0.004 ? c.map((v, k) => (v - (1 - a) * bg[k]) / a) : c;

  out[i] = Math.round(Math.min(1, Math.max(0, fg[0])) * 255);
  out[i + 1] = Math.round(Math.min(1, Math.max(0, fg[1])) * 255);
  out[i + 2] = Math.round(Math.min(1, Math.max(0, fg[2])) * 255);
  out[i + 3] = Math.round(a * 255);
}

mkdirSync("public", { recursive: true });

const mark = sharp(out, { raw: { width, height, channels: 4 } }).png().trim({ threshold: 8 });
const markBuf = await mark.toBuffer();

// Web logo: high res, single downscale, small padding so the glow never clips.
await sharp(markBuf)
  .resize(680, 680, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 16, bottom: 16, left: 16, right: 16, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile("public/logo.png");

// Favicons: the same mark, no tile, no added effects.
async function favicon(size, out) {
  await sharp(markBuf)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
}
await favicon(256, "app/icon.png");
await favicon(180, "app/apple-icon.png");

console.log("logo as-is, grey removed", { bg: bg.map((v) => Math.round(v * 255)) });
