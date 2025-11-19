import dotenv from "dotenv";
dotenv.config();

const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export { ACCESS_EXPIRES, REFRESH_EXPIRES, ACCESS_SECRET, REFRESH_SECRET };
