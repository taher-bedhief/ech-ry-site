import mongoose from "mongoose";

export function validateProductId(productId: string) {
  // ✅ Vérifie si c’est un ObjectId valide
  if (mongoose.Types.ObjectId.isValid(productId)) {
    return { type: "objectId", value: productId };
  }

  // ✅ Vérifie si c’est un originalId (ex: "0000000401")
  // Ici tu peux mettre ta logique métier : regex, longueur fixe, etc.
  if (/^\d{10}$/.test(productId)) {
    return { type: "originalId", value: productId };
  }

  // ❌ Sinon, invalide
  return null;
}
