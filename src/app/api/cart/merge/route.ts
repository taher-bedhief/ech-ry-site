import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cart from "@/lib/models/cart";
import type { CartDocument, ICartItem } from "@/lib/models/cart";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

/* =========================
   POST – Fusion panier invité → utilisateur connecté
========================= */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // 🔹 Authentification via NextAuth (Keycloak / Google)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userKey = session.user.email;

    // 🔹 Récupération des items du panier invité envoyés par frontend
    const body = await request.json();
    const guestItems: ICartItem[] = body.guestItems || [];

    // 🔹 Cherche le panier existant pour cet utilisateur
    let userCart: CartDocument | null = await Cart.findOne({ user: userKey });

    /* =========================
       CAS 1 : aucun panier → création
    ========================= */
    if (!userCart) {
      const newCart = await Cart.create({
        user: userKey,
        items: guestItems.map((i) => ({
          product: String(i.product), // ✅ toujours originalId
          quantity: i.quantity,
          price: i.price,
          title: i.title ?? "Produit inconnu",
          image: Array.isArray(i.image) ? i.image : [i.image ?? "/placeholder.jpg"],
          unit_of_measure: i.unit_of_measure ?? "",
          shop_category: i.shop_category ?? "",
        })),
      });

      return NextResponse.json({ items: newCart.items });
    }

    /* =========================
       CAS 2 : fusion panier invité avec existant
    ========================= */
    guestItems.forEach((guestItem) => {
      const normalizedProductId = String(guestItem.product);
      const existingItem = userCart!.items.find(
        (item) => String(item.product) === normalizedProductId
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        userCart!.items.push({
          product: normalizedProductId,
          quantity: guestItem.quantity,
          price: guestItem.price ?? 0,
          title: guestItem.title ?? "Produit inconnu",
          image: Array.isArray(guestItem.image)
            ? guestItem.image
            : [guestItem.image ?? "/placeholder.jpg"],
          unit_of_measure: guestItem.unit_of_measure ?? "",
          shop_category: guestItem.shop_category ?? "",
        });
      }
    });

    // 🔹 Sauvegarde Mongoose (pre('save') middleware recalcule total)
    await userCart.save();

    // 🔹 Retourne panier fusionné
    return NextResponse.json({ items: userCart.items });
  } catch (error: any) {
    console.error("💥 Erreur fusion panier:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
