import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Wishlist from "@/lib/models/wishlist";

export const dynamic = "force-dynamic";

/**
 * GET /api/wishlist?email=...
 * 🔹 Récupère le wishlist complet d’un utilisateur
 */
export async function GET(req: NextRequest) {
  await dbConnect();
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Missing email" },
      { status: 400 }
    );
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const wishlist = await Wishlist.findOne({ userEmail: normalizedEmail }).select("items");
    return NextResponse.json({ success: true, items: wishlist?.items || [] });
  } catch (err) {
    console.error("❌ GET wishlist error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * 🔹 Toggle (ajout/suppression) d’un produit dans le wishlist
 * Body: { email, product }
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  const { email, product } = await req.json();

  if (!email || !product) {
    return NextResponse.json(
      { success: false, error: "Missing email or product" },
      { status: 400 }
    );
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    let wishlist = await Wishlist.findOne({ userEmail: normalizedEmail });
    if (!wishlist) wishlist = new Wishlist({ userEmail: normalizedEmail, items: [] });

    // 🔹 Toggle intégré : ajoute si absent, supprime si présent
    const exists = wishlist.items.find((i: any) => i.originalId === product.originalId);
    wishlist.items = exists
      ? wishlist.items.filter((i: any) => i.originalId !== product.originalId)
      : [...wishlist.items, product];

    await wishlist.save();
    return NextResponse.json({ success: true, items: wishlist.items });
  } catch (err) {
    console.error("❌ POST wishlist error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update wishlist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist
 * 🔹 Vide complètement le wishlist d’un utilisateur
 * Body: { email }
 */
export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Missing email" },
      { status: 400 }
    );
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    await Wishlist.updateOne({ userEmail: normalizedEmail }, { $set: { items: [] } });
    return NextResponse.json({ success: true, items: [] });
  } catch (err) {
    console.error("❌ DELETE wishlist error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to clear wishlist" },
      { status: 500 }
    );
  }
}
