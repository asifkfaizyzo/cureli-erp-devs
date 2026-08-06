// src/features/marketplace/hooks/useHomeScreenConfig.ts
//
// Fetches home screen layout config from GET /mobile/app-config/home-screen.
//
// staleTime: 30 minutes — same as useBannerConfig and useMarketplaceDisplay.
// The config changes infrequently (cadmin-driven) so aggressive caching is fine.
//
// Error strategy:
//   - If the fetch fails, isError = true is surfaced to HomeScreen.
//   - HomeScreen shows a full-screen error state when this hook errors.
//   - Individual section failures (feed, banners) use their own error states.
//
// The hook never silently falls back to hardcoded defaults — the error
// is always surfaced so the caller can decide how to handle it.
// This matches the agreed behaviour from Phase 1 planning.

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HomeScreenConfig {
  heroCarouselVisible: boolean;
  stripBannersVisible:       boolean;
  categorySectionVisible:    boolean;
  categorySectionTitle:      string;
  categorySectionHint:       string;
  prescriptionBannerVisible: boolean;
  prescriptionBannerText:    string;
  productFeedVisible:        boolean;
}

interface HomeScreenConfigResponse {
  success: boolean;
  message: string;
  data: {
    config: HomeScreenConfig;
  };
}

// ── Query key ─────────────────────────────────────────────────────────────────

export const homeScreenConfigKey = ["app-config", "home-screen"] as const;

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchHomeScreenConfig(): Promise<HomeScreenConfig> {
  const res = await api.get<HomeScreenConfigResponse>(
    "/mobile/app-config/home-screen"
  );
  return res.data.data.config;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHomeScreenConfig(): {
  config:    HomeScreenConfig | null;
  isLoading: boolean;
  isError:   boolean;
  refetch:   () => Promise<unknown>;
} {
  const query = useQuery({
    queryKey:  homeScreenConfigKey,
    queryFn:   fetchHomeScreenConfig,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry:     1,               // one retry before surfacing error
  });

  return {
    config:    query.data ?? null,
    isLoading: query.isLoading,
    isError:   query.isError,
    refetch:   query.refetch,
  };
}