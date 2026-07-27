// src/lib/auth/utils.ts
import { NextRequest } from "next/server";
import { jwtVerify, SignJWT, JWTPayload as JoseJWTPayload } from "jose";

// ⚠️ Sécurité : on force la présence de JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface AppJWTPayload extends JoseJWTPayload {
  userId: string;
  role: string;
  email?: string;
  name?: string;
  picture?: string;
  provider?: "Keycloak" | "Google";
  groups?: string[];
}

/**
 * Génère un JWT compact signé avec jose
 */
export const generateToken = async (payload: AppJWTPayload): Promise<string> => {
  try {
    console.log("📌 [AuthUtils:generateToken] Payload reçu:", payload);

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    console.log("✅ [AuthUtils:generateToken] Token généré:", token);
    return token;
  } catch (error) {
    console.error("💥 [AuthUtils:generateToken] Error generating token:", error);
    throw error;
  }
};

/**
 * Vérifie et décode un JWT
 */
export const verifyToken = async (token: string): Promise<AppJWTPayload | null> => {
  if (!token || token === "undefined" || token === "[object Object]") {
    console.warn("⚠️ [AuthUtils:verifyToken] Invalid token format:", token);
    return null;
  }

  try {
    console.log("➡️ [AuthUtils:verifyToken] Vérification du token...");
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log("✅ [AuthUtils:verifyToken] Token décodé:", payload);

    if (!payload.userId || !payload.role) {
      console.error("❌ [AuthUtils:verifyToken] Token missing required fields:", payload);
      return null;
    }

    const verified: AppJWTPayload = {
      userId: payload.userId as string,
      role: payload.role as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
      provider: payload.provider as "Keycloak" | "Google" | undefined,
      groups: payload.groups as string[] | undefined,
    };

    console.log("✅ [AuthUtils:verifyToken] Payload vérifié:", verified);
    return verified;
  } catch (error: any) {
    console.error("💥 [AuthUtils:verifyToken] Token verification error:", error.message || error);
    return null;
  }
};

/**
 * Récupère le token depuis la requête (header ou cookie)
 */
export const getTokenFromRequest = (request: NextRequest): string | null => {
  try {
    console.log("➡️ [AuthUtils:getTokenFromRequest] Checking headers and cookies...");
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("📌 [AuthUtils:getTokenFromRequest] Token trouvé dans header:", token);
      if (token && token !== "undefined" && token !== "[object Object]") {
        return token;
      }
    }

    const token = request.cookies.get("auth_token")?.value;
    console.log("📌 [AuthUtils:getTokenFromRequest] Token trouvé dans cookie:", token);
    if (token && token !== "undefined" && token !== "[object Object]") {
      return token;
    }

    console.warn("⚠️ [AuthUtils:getTokenFromRequest] Aucun token trouvé");
    return null;
  } catch (error) {
    console.error("💥 [AuthUtils:getTokenFromRequest] Error getting token:", error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = async (request: NextRequest) => {
  console.log("➡️ [AuthUtils:isAuthenticated] Vérification de l'authentification...");
  const token = getTokenFromRequest(request);
  if (!token) {
    console.warn("⚠️ [AuthUtils:isAuthenticated] Aucun token trouvé");
    return null;
  }
  const verified = await verifyToken(token);
  console.log("✅ [AuthUtils:isAuthenticated] Résultat:", verified);
  return verified;
};

/**
 * Exige une authentification
 */
export const requireAuth = async (request: NextRequest) => {
  console.log("➡️ [AuthUtils:requireAuth] Vérification obligatoire de l'authentification...");
  const auth = await isAuthenticated(request);
  if (!auth) {
    console.error("❌ [AuthUtils:requireAuth] Authentication required");
    throw new Error("Authentication required");
  }
  console.log("✅ [AuthUtils:requireAuth] Authentifié:", auth);
  return auth;
};


export const requireRole = async (request: NextRequest, roles: string[]) => {
  console.log("➡️ [AuthUtils:requireRole] Vérification du rôle requis:", roles);
  const auth = await requireAuth(request);
  if (!roles.includes(auth.role)) {
    console.error("❌ [AuthUtils:requireRole] Insufficient permissions, role:", auth.role);
    throw new Error("Insufficient permissions");
  }
  console.log("✅ [AuthUtils:requireRole] Rôle validé:", auth.role);
  return auth;
};
