// src/features/marketplace/hooks/useBannerConfig.ts

import { useQuery } from "@tanstack/react-query";
import { bannersApi } from "../api/banners.api";
import type { RemoteHeroBannerSlide, RemoteStripBanner } from "../api/banners.api";
import { HERO_BANNERS, type HeroBannerSlide } from "../constants/marketplace.constants";

export const bannerConfigKey = ["app-config", "home-banners"] as const;

function remoteToLocal(remote: RemoteHeroBannerSlide): HeroBannerSlide {
  return {
    id:             remote.slideId,
    title:          remote.title,
    subtitle:       remote.subtitle ?? "",
    ctaLabel:       remote.ctaLabel ?? "Learn More",
    ctaRoute:       resolveCtaRoute(remote.ctaAction, remote.ctaActionValue),
    imageUrl:       remote.imageUrl,
    placeholderIcon: remote.placeholderIcon,
    gradientIndex:  remote.gradientIndex,
    gradientColor1: remote.gradientColor1 ?? null,
    gradientColor2: remote.gradientColor2 ?? null,
    gradientAngle:  remote.gradientAngle  ?? null,
    layoutMode:     remote.layoutMode ?? "TEXT_WITH_IMAGE",
  };
}

function resolveCtaRoute(
  action: RemoteHeroBannerSlide["ctaAction"],
  value: string | null
): string {
  switch (action) {
    case "ROUTE":        return value ?? "/search";
    case "CATEGORY":     return value ? `/marketplace/category?key=${encodeURIComponent(value)}` : "/search";
    case "EXTERNAL_URL": return value ?? "/search";
    case "NONE":
    default:             return "";
  }
}

export interface BannerConfig {
  slides: HeroBannerSlide[];
  strips: RemoteStripBanner[];
}

export function useBannerConfig(): {
  config: BannerConfig;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
} {
  const query = useQuery({
    queryKey: bannerConfigKey,
    queryFn:  bannersApi.getHomeBanners,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const config: BannerConfig = (() => {
    if (query.isError || !query.data) {
      return { slides: HERO_BANNERS, strips: [] };
    }

    const slides =
      query.data.slides.length > 0
        ? query.data.slides.map(remoteToLocal)
        : HERO_BANNERS;

    return {
      slides,
      strips: query.data.strips ?? [],
    };
  })();

  return {
    config,
    isLoading: query.isLoading,
    refetch:   query.refetch,
  };
}