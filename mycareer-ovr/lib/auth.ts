import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // EmailProvider removed - requires email server configuration and database adapter
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, check if user exists and create/update
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        
        if (existingUser) {
          // Update user image from Google if not set
          if (!existingUser.image && user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image: user.image, name: user.name || existingUser.name },
            });
          }
        } else {
          // Create new user from Google OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              onboardingComplete: false,
              profileComplete: false,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - add user info to token
      if (user) {
        // For OAuth providers, fetch the user ID from database
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true },
          });
          token.id = dbUser?.id;
        } else {
          // For credentials provider, user.id is already available
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            onboardingComplete: true,
            profileComplete: true,
          },
        });
        
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.onboardingComplete = dbUser.onboardingComplete;
          session.user.profileComplete = dbUser.profileComplete;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};

