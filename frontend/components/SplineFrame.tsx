"use client";

import { useState } from "react";

/**
 * Embeds a published Spline scene (my.spline.design/... viewer link) as a
 * non-interactive hero background — the scene keeps its own idle animation,
 * while pointer events pass through so scrolling and the CTA stay smooth.
 */
export default function SplineFrame({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="spline-wrap">
      {!loaded && <div className="spline-skeleton shimmer" />}
      <iframe
        src={url}
        title="Solvent — confidential vault"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="spline-frame"
        style={{ opacity: loaded ? 1 : 0 }}
        allow="autoplay; fullscreen"
      />
      {/* mask the free-tier Spline badge in the corner */}
      <div className="spline-badge-mask" />
    </div>
  );
}
