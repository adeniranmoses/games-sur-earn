import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        if (process.env.NODE_ENV !== "production") {
          console.log(`[AUTH] Login attempt for email: "${normalizedEmail}", password length: ${credentials.password.length}`);
        }

        // Find the user in our database
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[AUTH] User not found for email: "${normalizedEmail}"`);
          }
          throw new Error("Invalid email or password");
        }

        // Verify the password using bcrypt (never compare plain text!)
        let isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid && credentials.password.trim() !== credentials.password) {
          isPasswordValid = await bcrypt.compare(
            credentials.password.trim(),
            user.passwordHash
          );
        }

        if (process.env.NODE_ENV !== "production") {
          console.log(`[AUTH] User found (${user.id}), password valid: ${isPasswordValid}, status: ${user.accountStatus}, emailVerified: ${user.emailVerified}`);
        }

        if (!isPasswordValid) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[AUTH] Password comparison failed!`);
          }
          throw new Error("Invalid email or password");
        }

        // Block banned and suspended accounts
        if (user.accountStatus === "BANNED") {
          throw new Error("Your account has been banned.");
        }
        if (user.accountStatus === "SUSPENDED") {
          throw new Error("Your account is temporarily suspended. Please contact support.");
        }

        // Require email verification before login
        if (!user.emailVerified) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[AUTH] Email not verified!`);
          }
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

// Next.js App Router requires named exports GET and POST
export { handler as GET, handler as POST };
