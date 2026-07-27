
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import { requireAuth } from "@/lib/auth/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$amount", "$lowStockThreshold"] }
    }).lean();

    return NextResponse.json({ products: lowStockProducts });
  } catch (error: any) {
    console.error("❌ Error fetching low-stock products:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
