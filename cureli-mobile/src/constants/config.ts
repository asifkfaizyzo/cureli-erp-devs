// src/constants/config.ts

// const DEV_BASE_URL = 'http://localhost:5000';  // ← replace x with your machine's local IP
// const PROD_BASE_URL = 'https://api.curelihealth.com';    // ← replace with your production URL

const DEV_BASE_URL = "http://192.168.29.69:5000";
const PROD_BASE_URL = "https://api.cureliofficial.com";

// 192.168.29.69:5000
// localhost:5000

export const CONFIG = {
  BASE_URL: __DEV__ ? DEV_BASE_URL : PROD_BASE_URL,
  API_TIMEOUT: 15000,
};