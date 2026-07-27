import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import { requireAuth } from "@/lib/auth/utils";
import type { BaseProduct } from "@/types/product";

// =========================
// GET – liste des produits featured
// =========================
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    console.log("✅ [API GET featured] DB connected");

    const { searchParams } = new URL(request.url);
    const query: any = {};

    // 🔍 Recherche par titre ou description
    if (searchParams.has("search")) {
      const searchRegex = new RegExp(searchParams.get("search") as string, "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // 🔍 Filtrer par category, shop_category ou featured
    if (searchParams.has("category")) {
      query.shop_category = searchParams.get("category");
      console.log("🔍 [API GET featured] category filter:", query.shop_category);
    } else if (searchParams.has("shop_category")) {
      query.shop_category = searchParams.get("shop_category");
      console.log("🔍 [API GET featured] shop_category filter:", query.shop_category);
    } else if (searchParams.has("featured")) {
      query.shop_category = searchParams.get("featured");
      console.log("🔍 [API GET featured] featured filter:", query.shop_category);
    }

    // 🔍 Filtrer par catégories multiples
    if (searchParams.has("categories")) {
      const categories = searchParams.get("categories")?.split(",") || [];
      if (categories.length > 0) {
        query.categories = { $in: categories };
      }
    }

    // 🔍 Filtrer par prix
    if (searchParams.has("minPrice") || searchParams.has("maxPrice")) {
      query.price = {};
      if (searchParams.has("minPrice")) {
        const min = parseFloat(searchParams.get("minPrice") as string);
        if (!isNaN(min)) query.price.$gte = min;
      }
      if (searchParams.has("maxPrice")) {
        const max = parseFloat(searchParams.get("maxPrice") as string);
        if (!isNaN(max)) query.price.$lte = max;
      }
    }

    // 📄 Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // 📑 Tri sécurisé
    let sort: any = { createdAt: -1 };
    if (searchParams.has("sort")) {
      const sortParam = searchParams.get("sort") as string;
      const [field, order] = sortParam.split(":");
      if (field && field.trim() !== "") {
        sort = { [field]: order === "desc" ? -1 : 1 };
      }
    }

    console.log("📡 [API GET featured] Query params:", Object.fromEntries(searchParams));
    console.log("🔎 [API GET featured] Mongo query:", query);
    console.log("⚙️ [API GET featured] Sort:", sort, "Skip:", skip, "Limit:", limit);

    const products: BaseProduct[] = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean<BaseProduct[]>();

    const total = await Product.countDocuments(query);

    console.log("📦 [API GET featured] Products count:", products.length, "Total:", total);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("💥 [API GET featured] Error fetching products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =========================
// POST – créer un produit
// =========================
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    console.log("🔐 [API POST featured] Auth:", auth);

    if (auth.role !== "admin") {
      console.warn("⚠️ [API POST featured] Unauthorized attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    console.log("✅ [API POST featured] DB connected");

    const body = await request.json();
    console.log("📥 [API POST featured] Body:", body);

    const product: BaseProduct = await Product.create(body);
    console.log("🛒 [API POST featured] Product created:", product._id);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error("💥 [API POST featured] Error creating product:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
