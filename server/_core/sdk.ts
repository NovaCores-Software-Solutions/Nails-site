import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  userId: number;
  role: string;
};

class AuthService {
  private getSecretKey() {
    const secret = ENV.sessionSecret || "dev-secret-change-in-prod";
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async createSessionToken(userId: number, role: string): Promise<string> {
    const secretKey = this.getSecretKey();
    const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
    return new SignJWT({ userId, role })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
      const secretKey = this.getSecretKey();
      const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
      const { userId, role } = payload as Record<string, unknown>;
      if (typeof userId !== "number" || typeof role !== "string") return null;
      return { userId, role };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) throw ForbiddenError("Invalid session");
    const user = await db.getUserById(session.userId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
}

export const sdk = new AuthService();
