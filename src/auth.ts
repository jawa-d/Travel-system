import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clearRateLimit, rateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        if (!checkRateLimit(attemptKey, 5).ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.active) {
          rateLimit(attemptKey, 5, 15 * 60_000);
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          rateLimit(attemptKey, 5, 15 * 60_000);
          return null;
        }
        clearRateLimit(attemptKey);
        return { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.role = (user as typeof user & { role: Role }).role;
        token.active = (user as typeof user & { active?: boolean }).active ?? true;
      } else if (token.sub) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { name: true, role: true, active: true }
        });
        if (currentUser) {
          token.name = currentUser.name;
          token.role = currentUser.role;
          token.active = currentUser.active;
        } else {
          token.active = false;
        }
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
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          role: (user as typeof user & { role?: Role }).role,
          action: "USER_LOGIN",
          entity: "User",
          entityId: user.id,
          ipAddress: "next-auth"
        }
      });
    }
  }
});
