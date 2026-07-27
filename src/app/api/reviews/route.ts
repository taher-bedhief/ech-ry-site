import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Review from "@/lib/models/reviews"; 
import Product from "@/lib/models/product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("❌ Error in GET /api/reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { userId, productId, rating, comment } = await request.json();

    if (!userId || !productId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // 🔹 Mettre à jour si déjà existant, sinon créer
    await Review.updateOne(
      { userId, productId },
      { $set: { rating, comment, createdAt: new Date() } },
      { upsert: true }
    );

    // 🔹 Recalculer la moyenne
    const avg = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: "$productId", avgRating: { $avg: "$rating" } } },
    ]);

    const avgRating = avg[0]?.avgRating || 0;

    // 🔹 Mettre à jour le produit
    await Product.updateOne(
      { originalId: productId },
      { $set: { rating: avgRating } }
    );

    // 🔹 Synchroniser avec productAnalytics
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/product-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "rating",
        productId,
        productName: "User rating", // tu peux remplacer par le vrai nom via Product.findOne
        rating
      }),
    });

    return NextResponse.json({ success: true, avgRating });
  } catch (error: any) {
    console.error("❌ Error in POST /api/reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
