// src/constants/config.ts

const DEV_BASE_URL = 'http://localhost:5000';  // ← replace x with your machine's local IP
const PROD_BASE_URL = 'https://api.curelihealth.com';    // ← replace with your production URL

// const DEV_BASE_URL = "http://localhost:5000";
// const PROD_BASE_URL = "https://api.curelihealth.com";

// 192.168.29.69:5000
// localhost:5000

export const CONFIG = {
  BASE_URL: __DEV__ ? DEV_BASE_URL : PROD_BASE_URL,
  API_TIMEOUT: 15000,
};


export const CART_CONFIG = {
  HANDLING_CHARGE: 10,
  DELIVERY_CHARGE: 30,
  FREE_DELIVERY_ABOVE: 500,
} as const;

export const RECOMMENDATIONS_LIMIT = 6;
export const DELIVERY_BUFFER_MINS = 8;
