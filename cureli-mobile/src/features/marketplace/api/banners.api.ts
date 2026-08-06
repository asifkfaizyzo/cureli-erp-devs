// src/features/marketplace/api/banners.api.ts

import { api } from "../../../services/api";

export interface RemoteHeroBannerSlide {
  slideId:         string;
  position:        number;
  title:           string;
  subtitle:        string | null;
  imageUrl:        string | null;
  ctaLabel:        string | null;
  ctaAction:       "NONE" | "ROUTE" | "CATEGORY" | "EXTERNAL_URL";
  ctaActionValue:  string | null;
  gradientIndex:   number;
  gradientColor1:  string | null;
  gradientColor2:  string | null;
  gradientAngle:   number | null;
  placeholderIcon: string;
  layoutMode:      "FULL_IMAGE" | "TEXT_WITH_IMAGE" | null;
}

export interface RemoteStripBanner {
  stripId:        string;
  position:       number;
  imageUrl:       string | null;
  ctaAction:      "NONE" | "ROUTE" | "CATEGORY" | "EXTERNAL_URL";
  ctaActionValue: string | null;
}

export interface HomeBannersResponse {
  slides: RemoteHeroBannerSlide[];
  strips: RemoteStripBanner[];
}

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export const bannersApi = {
  getHomeBanners: async (): Promise<HomeBannersResponse> => {
    const res = await api.get<ApiWrapper<HomeBannersResponse>>(
      "/mobile/app-config/home-banners"
    );
    return res.data.data;
  },
};