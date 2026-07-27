import { NextApiRequest } from "next";
import { parse } from "cookie";

// Ici on suppose que tu stockes le token Cognito dans un cookie "cognitoAccessToken"
// au moment du login (via ton endpoint /api/auth/login).
export async function getSession(req: NextApiRequest) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const accessToken = cookies["cognitoAccessToken"];

  if (!accessToken) {
    return null;
  }

  return { accessToken };
}
