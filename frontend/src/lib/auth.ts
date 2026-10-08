import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";

import clientPromise from "@/lib/mongodb";
import { loginSchema } from "@/lib/auth-schema";

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    // Google verifies emails, so linking to an existing account is safe.
    Google({ allowDangerousEmailAccountLinking: true }),
    Facebook,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const db = (await clientPromise).db();
        const user = await db
          .collection("users")
          .findOne({ email: parsed.data.email });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        if (!user.emailVerified) throw new EmailNotVerified();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image ?? null,
        };
      },
    }),
  ],
});