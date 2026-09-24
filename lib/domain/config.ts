import type { HeroBannerConfig, HeroSlide, TopSellingSectionConfig } from '@/types';
import { DEFAULT_TOP_SELLING_CONFIG } from '@/types';
import { DEFAULT_HERO_CONFIG } from '@/lib/constants/heroDefaults';

/** settings.heroBanners is stored either as the full config or (older data) as a bare slide array; null -> defaults. */
export function normalizeHero(raw: HeroBannerConfig | HeroSlide[] | null | undefined): HeroBannerConfig {
  if (!raw) return structuredClone(DEFAULT_HERO_CONFIG);
  if (Array.isArray(raw)) return { slides: structuredClone(raw), promoCard: structuredClone(DEFAULT_HERO_CONFIG.promoCard) };
  return structuredClone({ slides: raw.slides ?? DEFAULT_HERO_CONFIG.slides, promoCard: raw.promoCard ?? DEFAULT_HERO_CONFIG.promoCard });
}

/** Deep copy so the editors (which mutate items in place, like the legacy code) never touch the React Query cache. */
export function normalizeTopSelling(raw: TopSellingSectionConfig | null | undefined): TopSellingSectionConfig {
  return structuredClone(raw ?? DEFAULT_TOP_SELLING_CONFIG);
}
