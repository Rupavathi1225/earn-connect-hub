import { useState } from "react";
import { wallLogoCandidates } from "@/lib/logos";

type Props = {
  name: string;
  logoUrl?: string | null;
  urlTemplate?: string | null;
  provider?: string | null;
  className?: string;
};

/** Offerwall logo with automatic fallback through favicon sources, then a letter badge. */
export function WallLogo({ name, logoUrl, urlTemplate, provider, className = "h-10 w-10" }: Props) {
  const candidates = wallLogoCandidates(logoUrl, urlTemplate, provider);
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  if (!src) {
    return (
      <span className={`${className} rounded-full bg-[#1a1c3a] text-white flex items-center justify-center font-bold`}>
        {name[0]?.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
      className={`${className} object-contain rounded bg-white`}
    />
  );
}
