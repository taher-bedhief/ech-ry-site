import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import type { BaseProduct } from "@/types/product";

export const dynamic = "force-dynamic";

// ================= GET =================
export async function GET(req: Request) {
  console.log("🔎 [API/Products/Dashboard] GET request");

  try {
    await dbConnect();
    console.log("✅ DB connected");

    const url = new URL(req.url);
    const updatedAfter = url.searchParams.get("updatedAfter");
    const filter: Record<string, any> = {};
    if (updatedAfter) {
      filter.updatedAt = { $gte: new Date(updatedAfter) };
      console.log("🕒 Filtrage produits updatedAfter:", updatedAfter);
    }

    const products: BaseProduct[] = await Product.find(filter)
      .select(
        "originalId title description price oldPrice categories image rating amount shop_category unit_of_measure colors sizes authors safeSlug isActive reserved sales lowStockThreshold supplier createdAt updatedAt"
      )
      .lean<BaseProduct[]>();

    console.log("📦 Produits trouvés:", products.length);

    // ===== Calcul du statut =====
    const enrichedProducts = products.map((p) => {
      let status: "Active" | "Warning" | "Inactive" | "OutOfStock";

      if (p.isActive === false) status = "Inactive";
      else if ((p.amount ?? 0) === 0) status = "OutOfStock";
      else if ((p.amount ?? 0) <= (p.lowStockThreshold ?? 5)) status = "Warning";
      else status = "Active";

      return { ...p, status };
    });

    // ===== Stats =====
    const stats = {
      totalProducts: enrichedProducts.length,
      totalUnits: enrichedProducts.reduce((sum, p) => sum + (p.amount ?? 0), 0),
      totalReserved: enrichedProducts.reduce((sum, p) => sum + (p.reserved ?? 0), 0),
      totalSales: enrichedProducts.reduce((sum, p) => sum + (p.sales ?? 0), 0),
      lowStockCount: enrichedProducts.filter((p) => p.status === "Warning").length,
      inactiveCount: enrichedProducts.filter((p) => p.status === "Inactive").length,
      outOfStockCount: enrichedProducts.filter((p) => p.status === "OutOfStock").length,
    };

    console.log("📊 Stats calculées:", stats);

    return NextResponse.json({
      success: true,
      stats,
      products: enrichedProducts,
    });
  } catch (error: any) {
    console.error("💥 GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch dashboard products" },
      { status: 500 }
    );
  }
}
