import { NextRequest } from "next/server";
import {
  jwtVerify,
  SignJWT,
  createRemoteJWKSet,
  JWTPayload as JoseJWTPayload,
} from "jose";

// 🔹 Variables d’environnement
const region = process.env.AWS_REGION!;
const userPoolId = process.env.COGNITO_USER_POOL_ID!;

// 🔹 JWKS Cognito (clés publiques RS256)
const JWKS = createRemoteJWKSet(
  new URL(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`)
);

// 🔹 Secret pour ton appToken interne (HS256)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-jwt-secret-key"
);

export interface AppJWTPayload extends JoseJWTPayload {
  userId: string;
  role: string;
  email?: string;
  name?: string;
  picture?: string;
  provider?: string;
  groups?: string[];
}

export const generateToken = async (payload: AppJWTPayload): Promise<string> => {
  console.log("📌 [AuthUtils:generateToken] Payload reçu:", payload);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  console.log("✅ [AuthUtils:generateToken] Token généré:", token);
  return token;
};

export const verifyToken = async (token: string): Promise<AppJWTPayload | null> => {
  console.log("➡️ [AuthUtils:verifyToken] Vérification du token...");

  if (!token || token === "undefined" || token === "[object Object]") {
    console.warn("⚠️ [AuthUtils:verifyToken] Format de token invalide:", token);
    return null;
  }

  try {
    // Essai Cognito (RS256)
    console.log("🔍 [AuthUtils:verifyToken] Tentative de vérification Cognito (RS256)...");
    const { payload } = await jwtVerify(token, JWKS);

    if (!payload.role) {
      payload.role = "user"; // rôle par défaut
      console.log("📌 [AuthUtils:verifyToken] Rôle ajouté par défaut:", payload.role);
    }

    console.log("✅ [AuthUtils:verifyToken] Token Cognito validé:", payload);
    return payload as AppJWTPayload;
  } catch (errRS256) {
    console.warn("⚠️ [AuthUtils:verifyToken] Échec Cognito RS256:", errRS256);

    try {
      // Fallback appToken interne (HS256)
      console.log("🔍 [AuthUtils:verifyToken] Tentative de vérification interne (HS256)...");
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (!payload.userId) {
        console.error("❌ [AuthUtils:verifyToken] Token HS256 incomplet:", payload);
        return null;
      }

      if (!payload.role) {
        payload.role = "user"; // rôle par défaut
        console.log("📌 [AuthUtils:verifyToken] Rôle ajouté par défaut:", payload.role);
      }

      console.log("✅ [AuthUtils:verifyToken] Token interne validé:", payload);
      return payload as AppJWTPayload;
    } catch (errHS256) {
      console.error("💥 [AuthUtils:verifyToken] Échec HS256:", errHS256);
      return null;
    }
  }
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  console.log("➡️ [AuthUtils:getTokenFromRequest] Extraction du token...");

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7);
    console.log("✅ [AuthUtils:getTokenFromRequest] Token trouvé dans Authorization header:", bearerToken);
    return bearerToken;
  }

  const cookieToken = request.cookies.get("auth_token")?.value || null;
  if (cookieToken) {
    console.log("✅ [AuthUtils:getTokenFromRequest] Token trouvé dans cookie:", cookieToken);
  } else {
    console.warn("⚠️ [AuthUtils:getTokenFromRequest] Aucun token trouvé dans headers ou cookies");
  }

  return cookieToken;
};

export const isAuthenticated = async (request: NextRequest) => {
  console.log("➡️ [AuthUtils:isAuthenticated] Vérification de l’authentification...");
  const token = getTokenFromRequest(request);
  if (!token) {
    console.warn("⚠️ [AuthUtils:isAuthenticated] Pas de token → utilisateur non authentifié");
    return null;
  }

  const payload = await verifyToken(token);
  if (payload) {
    console.log("✅ [AuthUtils:isAuthenticated] Utilisateur authentifié:", payload);
  } else {
    console.warn("❌ [AuthUtils:isAuthenticated] Token invalide → utilisateur non authentifié");
  }
  return payload;
};

export const requireAuth = async (request: NextRequest) => {
  console.log("➡️ [AuthUtils:requireAuth] Authentification requise...");
  const auth = await isAuthenticated(request);
  if (!auth) {
    console.error("❌ [AuthUtils:requireAuth] Échec → Authentification requise");
    throw new Error("Authentication required");
  }
  console.log("✅ [AuthUtils:requireAuth] Authentification réussie:", auth);
  return auth;
};


export const requireRole = async (request: NextRequest, roles: string[]) => {
  console.log("➡️ [AuthUtils:requireRole] Vérification du rôle requis:", roles);
  const auth = await requireAuth(request);

  if (!roles.includes(auth.role)) {
    console.error(
      `❌ [AuthUtils:requireRole] Rôle insuffisant: ${auth.role}, requis: ${roles.join(", ")}`
    );
    throw new Error("Insufficient permissions");
  }

  console.log("✅ [AuthUtils:requireRole] Rôle validé:", auth.role);
  return auth;
};
