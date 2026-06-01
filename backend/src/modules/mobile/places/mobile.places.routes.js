// src/modules/mobile/places/mobile.places.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import {
  handleSearchPlaces,
  handleGetPlaceDetails,
  handleReverseGeocode,
} from "./mobile.places.controller.js";

const router = Router();

// All places routes require mobile authentication
router.use(mobileAuth);


/**
 * GET /mobile/places/search?query=
 * Text search → place predictions
 */
router.get("/places/search", handleSearchPlaces);

/**
 * GET /mobile/places/details?place_id=
 * place_id → full address + geometry
 */
router.get("/places/details", handleGetPlaceDetails);

/**
 * GET /mobile/places/reverse?lat=&lng=
 * Coordinates → nearest address
 */
router.get("/places/reverse", handleReverseGeocode);

export default router;