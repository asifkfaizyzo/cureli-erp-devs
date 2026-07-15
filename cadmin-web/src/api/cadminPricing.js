// cadmin-web/src/api/cadminPricing.js

import CAdminAPI from "./axios";

export const getPricingConfig = () =>
  CAdminAPI.get("/marketplace/pricing-config");

export const updatePricingConfig = (data) =>
  CAdminAPI.put("/marketplace/pricing-config", data);