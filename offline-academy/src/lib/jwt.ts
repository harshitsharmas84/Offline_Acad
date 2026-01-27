import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function signAccessToken(payload: object) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
