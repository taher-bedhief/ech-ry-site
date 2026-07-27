// src/app/api/products/books/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import type { BaseProduct } from "@/types/product";

// ✅ Force Next.js à traiter cette route comme dynamique
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    console.log("📡 [API GET books] Request received:", request.url);

    await dbConnect();
    console.log("✅ [API GET books] DB connected");

    const products: BaseProduct[] = await Product.find({ shop_category: "books" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<BaseProduct[]>();

    console.log("📚 [API GET books] Products fetched:", {
      count: products.length,
      ids: products.map((p) => p._id),
    });

    if (!products.length) {
      console.warn("⚠️ [API GET books] No products found in category 'books'");
      return NextResponse.json({ products: [], message: "No books found" });
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("💥 [API GET books] Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books", details: error.message },
      { status: 500 }
    );
  }
}
