// Reprocess the source logo into a crisp transparent mark + high-contrast
// favicons. The source is a soft glow render, so we key out the grey bg,
// hard-cut the faint halo for a tight silhouette, sharpen, and (for favicons)
// composite onto a dark rounded tile for readability at small sizes.
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

const px = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};
const corners = [px(4, 4), px(width - 5, 4), px(4, height - 5), px(width - 5, height - 5)];
const bg = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / 4);

for (let i = 0; i < data.length; i += 4) {
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  const d = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  let a = Math.max(smoothstep(46, 96, d), smoothstep(0.34, 0.55, sat));
  // hard-cut faint halo -> tight silhouette, then keep the solid mark crisp
  a = a < 0.42 ? 0 : Math.min(1, (a - 0.42) / 0.5 + 0.25);
  data[i + 3] = Math.round(a * 255);
}

mkdirSync("public", { recursive: true });

// tightly-cropped, punchier mark on transparency
const mark = sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .trim({ threshold: 24 })
  .modulate({ saturation: 1.18, brightness: 1.05 })
  .sharpen({ sigma: 1 });
const markBuf = await mark.toBuffer();

// 1) web logo (transparent, small padding so it isn't clipped)
await sharp(markBuf)
  .resize(432, 432, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 40, bottom: 40, left: 40, right: 40, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize(512, 512)
  .png()
  .toFile("public/logo.png");

// dark rounded tile for favicons -> readable at 16px
function tile(size) {
  const r = Math.round(size * 0.22);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <radialGradient id="g" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#2a1140"/>
          <stop offset="100%" stop-color="#0a0713"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
    </svg>`
  );
}
async function favicon(size, out) {
  const inner = Math.round(size * 0.72);
  const m = await sharp(markBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp(tile(size))
    .composite([{ input: m, gravity: "center" }])
    .png()
    .toFile(out);
}
await favicon(256, "app/icon.png");
await favicon(180, "app/apple-icon.png");

console.log("crisp logo + favicons written", { bg });
