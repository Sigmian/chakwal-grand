// ============================================================
// lib/auth/auth-options.ts
// NextAuth.js v4 configuration
//
// Auth strategy: credentials (email + password) with JWT session.
// Role and branchId are embedded in the JWT so every request
// can authorize without a DB round-trip.
// ============================================================

import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import type { UserRole } from "@/types";

// ─── Augment NextAuth types ────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: UserRole;
      companyId: string;
      branchId?: string;   // Only set for non-SUPER_ADMIN
    };
  }
  interface User {
    role: UserRole;
    companyId: string;
    branchId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    companyId: string;
    branchId?: string;
  }
}

// ─── Auth Options ─────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  // JWT sessions — no DB hit on every request
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom pages
  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // 1. Find user with their staff member (for branchId)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            staffMember: { select: { branchId: true } },
          },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Contact your manager.");
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        // 3. Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        });

        // 4. Return the shape NextAuth expects
        return {
          id:        user.id,
          email:     user.email,
          name:      user.name,
          image:     user.image ?? undefined,
          role:      user.role as UserRole,
          companyId: user.companyId,
          branchId:  user.staffMember?.branchId ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT callback — embed role/branch in token ──
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id        = user.id;
        token.role      = user.role;
        token.companyId = user.companyId;
        token.branchId  = user.branchId;
      }
      return token;
    },

    // ── Session callback — expose to client ──
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id        = token.id;
        session.user.role      = token.role;
        session.user.companyId = token.companyId;
        session.user.branchId  = token.branchId;
      }
      return session;
    },
  },

  // Encrypt JWT with a strong secret
  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};
