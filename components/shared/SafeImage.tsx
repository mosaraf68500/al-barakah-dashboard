'use client';

import Image from 'next/image';
import type { ImgHTMLAttributes } from 'react';

// Hosts listed in next.config.ts `images.remotePatterns` (optimised by next/image).
const OPTIMIZED_HOSTS = new Set(['images.unsplash.com', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com']);

function shouldOptimize(src: string): boolean {
  if (src.startsWith('/') && !src.startsWith('/api/media/')) return true; // local static asset
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'srcSet' | 'ref'> & {
  src?: string | null;
  width?: number | string;
  height?: number | string;
};

/**
 * Drop-in for legacy `<img>` (same className / style / event props) built on next/image.
 *  - `data:` URLs, seed media (`/api/media/*`) and unknown hosts render `unoptimized` (decision 7 / MIGRATION_PLAN Q12): nothing breaks.
 *  - Layout is driven by the caller's classes exactly as before; width/height are only the intrinsic-ratio hint next/image requires.
 */
export function SafeImage({ src, alt = '', width, height, className, ...rest }: Props) {
  if (!src) {
    // next/image throws on an empty src; legacy rendered a blank <img> in that case (e.g. category without a picture).
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} className={className} {...(rest as ImgHTMLAttributes<HTMLImageElement>)} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={Number(width) || 800}
      height={Number(height) || 800}
      className={className}
      unoptimized={!shouldOptimize(src)}
      {...rest}
    />
  );
}
