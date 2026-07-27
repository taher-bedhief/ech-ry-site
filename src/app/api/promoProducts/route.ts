import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import type { BaseProduct } from "@/types/product";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =========================
// GET – list of promo products
// =========================
export async function GET() {
  try {
    console.log("🔎 [API/PromoProducts] Incoming GET request");

    await dbConnect();
    console.log("✅ [API/PromoProducts] Database connected successfully");

    // Filter only promo products
    const products: BaseProduct[] = await Product.find({ promo: true })
      .sort({ updatedAt: -1 })
      .lean<BaseProduct[]>();

    console.log("🎯 [API/PromoProducts] Promo products found:", products);

    return NextResponse.json(products || []);
  } catch (error: any) {
    console.error("💥 [API/PromoProducts] GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch promo products" },
      { status: 500 }
    );
  }
}
