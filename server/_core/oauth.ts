import type { Express } from "express";

// OAuth routes removidas — autenticação agora é via email/senha (routers.ts)
export function registerOAuthRoutes(_app: Express) {
  // noop
}
