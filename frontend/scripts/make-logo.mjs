// Reprocess the source logo into a CRISP transparent mark + high-contrast
// favicons. The source is a neon 3D mark on a solid grey card with a soft
// purple glow. The UI already supplies its own glow (radial gradient +
// drop-shadow), so we DON'T keep the source halo — that only reads as a
// grainy blur. Instead we cut a tight, anti-aliased silhouette of the mark
// itself (saturated body + bright bevel highlights), at full source res with
// a single high-quality downscale so nothing softens.
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

// Build a clean alpha mask: keep pixels that are clearly part of the mark
// (highly saturated neon) OR bright bevel highlights (near-white rims). The
// grey background and the faint purple halo are low-saturation / mid-luminance
// and get dropped. A tight ramp keeps the silhouette crisp, not fuzzy.
for (let i = 0; i < data.length; i += 4) {
  const r = data[i] / 255,
    g = data[i + 1] / 255,
    b = data[i + 2] / 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  // Absolute chroma (colorfulness×brightness): the mark's neon body is vivid
  // AND bright -> high chroma; the diffuse purple halo is the same hue but
  // dimmer -> low chroma; grey bg -> ~0. This separates mark from glow where
  // saturation alone can't.
  const chroma = mx - mn;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  // vivid neon body of the mark
  const chromaKey = smoothstep(0.4, 0.6, chroma);
  // bright metallic bevel highlights (near-white rims) that carry the 3D edge
  const rimKey = smoothstep(0.85, 0.95, lum);
  let a = Math.max(chromaKey, rimKey);

  // hard floor to cut the faint halo, then re-solidify the mark so its
  // interior stays fully opaque (no see-through blotches)
  a = a < 0.5 ? 0 : Math.min(1, (a - 0.5) / 0.25 + 0.4);
  data[i + 3] = Math.round(a * 255);
}

mkdirSync("public", { recursive: true });

// Anti-alias the mask edge with a hair of blur so the silhouette isn't jagged,
// then tight-trim to the mark's bounding box. Everything stays at source res.
const mark = sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .blur(0.6)
  .trim({ threshold: 12 })
  .modulate({ saturation: 1.12 });
const markBuf = await mark.toBuffer();

// 1) web logo: crisp transparent mark, high res (single downscale), small
//    padding so the UI drop-shadow has room and edges never clip.
await sharp(markBuf)
  .resize(576, 576, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 32, bottom: 32, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
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
  const inner = Math.round(size * 0.74);
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

console.log("crisp logo + favicons written");
