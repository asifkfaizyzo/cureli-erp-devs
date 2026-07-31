// src/constants/config.ts
const DEV_BASE_URL  = 'http://192.168.100.106:3500';
const PROD_BASE_URL = 'https://api.curelihealth.com';

export const CONFIG = {
  BASE_URL:    __DEV__ ? DEV_BASE_URL : PROD_BASE_URL,
  API_TIMEOUT: 15000,
} as const;

export const OTP_LENGTH      = 6;
export const OTP_RESEND_WAIT = 30;