import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clearRateLimit, rateLimit } from "@/lib/rate-limit";
import { ensureBootstrapUsers } from "@/lib/bootstrap-admin";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const configuredAuthUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

if (process.env.NODE_ENV === "production" && !authSecret) {
  console.error("[auth] Missing AUTH_SECRET (or legacy NEXTAUTH_SECRET) in production");
}

if (process.env.VERCEL && configuredAuthUrl && /localhost|127\.0\.0\.1/i.test(configuredAuthUrl)) {
  console.error("[auth] AUTH_URL/NEXTAUTH_URL points to localhost on Vercel", { configuredAuthUrl });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
        const attemptKey = `login:${ipAddress}:${email || "missing"}`;
        if (!checkRateLimit(attemptKey, 5).ok) {
          console.warn("[auth] Login rate limit exceeded", { email, ipAddress });
          return null;
        }

        try {
          await ensureBootstrapUsers();
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash || !user.active) {
            rateLimit(attemptKey, 5, 15 * 60_000);
            console.warn("[auth] Login rejected", { email, ipAddress, reason: "user-not-found-or-inactive" });
            return null;
          }
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            rateLimit(attemptKey, 5, 15 * 60_000);
            console.warn("[auth] Login rejected", { email, ipAddress, reason: "invalid-password" });
            return null;
          }
          clearRateLimit(attemptKey);
          return { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active };
        } catch (error) {
          console.error("[auth] Credentials authorization failed", { email, ipAddress, error });
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.role = (user as typeof user & { role: Role }).role;
        token.active = (user as typeof user & { active?: boolean }).active ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = token.name;
        session.user.role = token.role as Role;
        session.user.active = token.active !== false;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      try {
        const account = await prisma.user.findUnique({
          where: { id: user.id },
          select: { agency: { select: { name: true } }, role: true }
        });
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            role: account?.role ?? (user as typeof user & { role?: Role }).role,
            agency: account?.agency?.name ?? null,
            action: "USER_LOGIN",
            entity: "User",
            entityId: user.id,
            ipAddress: "next-auth"
          }
        });
      } catch (error) {
        console.error("[auth] Failed to record login audit event", { userId: user.id, error });
      }
    }
  },
  logger: {
    error(error) {
      console.error("[auth][error]", error);
    },
    warn(code) {
      console.warn("[auth][warn]", code);
    },
    debug(message, metadata) {
      if (process.env.AUTH_DEBUG === "true") console.debug("[auth][debug]", message, metadata);
    }
  }
});
