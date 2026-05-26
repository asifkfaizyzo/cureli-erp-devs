// src/api/listings.js

import API from "./axios";

// ─────────────────────────────────────────────
// BRANCH SUMMARY
// ─────────────────────────────────────────────

export const getBranchSummary = () =>
  API.get("/marketplace/listings/summary");

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

export const getCategories = (branch_id) =>
  API.get("/marketplace/listings/categories", {
    params: { branch_id },
  });

export const updateCategoryVisibility = (data) =>
  API.patch("/marketplace/listings/categories", data);

// ─────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────

export const getListings = (params) =>
  API.get("/marketplace/listings", { params });

export const updateListing = (listing_id, patch) =>
  API.patch(`/marketplace/listings/${listing_id}`, patch);

export const bulkUpdateListings = (listing_ids, patch) =>
  API.post("/marketplace/listings/bulk", { listing_ids, patch });

export const syncInventory = (branch_id) =>
  API.post("/marketplace/listings/sync", null, {
    params: { branch_id },
  });