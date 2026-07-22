// One-off: key the flat grey background out of the source logo -> transparent PNG,
// then emit web logo + favicon set. Run: node scripts/make-logo.mjs
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

// sample background color from the four corners
const px = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};
const corners = [
  px(4, 4),
  px(width - 5, 4),
  px(4, height - 5),
  px(width - 5, height - 5),
];
const bg = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / 4);

// distance-keyed alpha with feather; saturated glow/mark stays, grey drops out
for (let i = 0; i < data.length; i += 4) {
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  const d = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  // keep if far from bg OR clearly saturated (violet/magenta) OR bright highlight
  let a = Math.max(smoothstep(34, 82, d), smoothstep(0.28, 0.5, sat));
  data[i + 3] = Math.round(a * 255);
}

mkdirSync("public", { recursive: true });

const keyed = sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .trim({ threshold: 10 });

// main web logo (transparent, tight)
await keyed.clone().resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile("public/logo.png");

// favicons (Next App Router auto-serves app/icon.png + apple-icon.png)
await keyed.clone().resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile("app/icon.png");
await keyed
  .clone()
  .resize(180, 180, { fit: "contain", background: { r: 10, g: 8, b: 16, alpha: 1 } })
  .flatten({ background: { r: 10, g: 8, b: 16 } })
  .toFile("app/apple-icon.png");

console.log("logo + favicons written:", { width, height, bg });
