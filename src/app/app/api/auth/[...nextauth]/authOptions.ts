import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("🔑 [JWT callback]");
      console.log("Account:", account);
      console.log("Profile:", profile);
      console.log("Token before:", token);

      if (account) {
        token.accessToken = account.access_token;
      }

      console.log("Token after:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("📦 [Session callback]");
      console.log("Session before:", session);
      console.log("Token:", token);

      session.accessToken = token.accessToken as string;

      console.log("Session after:", session);
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 [Redirect callback]");
      console.log("URL:", url);
      console.log("BaseUrl:", baseUrl);
      return baseUrl;
    },
  },
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
