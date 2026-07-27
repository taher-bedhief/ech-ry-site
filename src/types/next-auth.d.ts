import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Étendre la session NextAuth pour inclure accessToken, roles, groups, provider et role.
   */
  interface Session {
    accessToken?: string;
    roles?: string[];
    groups?: string[];
    provider?: string;

    // Fusion avec DefaultSession["user"] pour conserver id, email, name, image
    user: DefaultSession["user"] & {
      id?: string;
      role?: string; // rôle unique
    };
  }

  /**
   * Étendre l'utilisateur NextAuth pour inclure role, roles et groups.
   */
  interface User extends DefaultUser {
    id?: string;
    role?: string;
    roles?: string[];
    groups?: string[];
  }
}

declare module "next-auth/jwt" {

  interface JWT {
    accessToken?: string;
    roles?: string[];
    groups?: string[];
    provider?: string;
    role?: string;
  }
}