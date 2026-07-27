import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import { requireAuth } from "@/lib/auth/utils";
import type { BaseProduct } from "@/types/product";
import { v4 as uuidv4 } from "uuid";

// =========================
// GET – liste des produits
// =========================
export async function GET(request: NextRequest) {
  try {
    console.log("🔎 [API/Products] GET request:", request.url);

    await dbConnect();
    console.log("✅ [API/Products] DB connected");

    const { searchParams } = new URL(request.url);
    const query: any = {};

    // Recherche par titre
    if (searchParams.has("search")) {
      const searchValue = searchParams.get("search") as string;
      const searchRegex = new RegExp("^" + searchValue, "i");
      query.title = searchRegex;
    }

    // Filtre par catégorie de shop
    if (searchParams.has("shop_category")) {
      const shopCategory = searchParams.get("shop_category");
      if (shopCategory && shopCategory !== "Select Shop") {
        query.shop_category = shopCategory;
      }
    }

    // Filtre par catégories
    if (searchParams.has("categories")) {
      const categories = searchParams.get("categories")?.split(",") || [];
      if (categories.length > 0) {
        query.categories = { $in: categories };
      }
    }

    // Filtre par prix min/max
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

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Tri
    let sort: any = { shop_category: 1, title: 1 };
    if (searchParams.has("sort")) {
      const sortParam = searchParams.get("sort") as string;
      const [field, order] = sortParam.split(":");
      if (field && field.trim() !== "") {
        sort = { [field]: order === "desc" ? -1 : 1 };
      }
    }

    // Récupération des produits
    const products: BaseProduct[] = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean<BaseProduct[]>();

    const total = await Product.countDocuments(query);

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
    console.error("💥 [API/Products] GET error:", error);
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
    console.log("🔎 [API/Products] POST request");

    const auth = await requireAuth(request);
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();

    if (!body.shop_category) {
      return NextResponse.json({ error: "shop_category is required" }, { status: 400 });
    }

    const product: BaseProduct = await Product.create({
      ...body,
      originalId: body.originalId || uuidv4(),
      rating: body.rating || 0, // ✅ initialise le rating
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error("💥 [API/Products] POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

// =========================
// PUT – mettre à jour un produit existant
// =========================
export async function PUT(request: NextRequest) {
  try {
    console.log("🔎 [API/Products] PUT request");

    const auth = await requireAuth(request);
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();

    if (!body.originalId) {
      return NextResponse.json({ error: "originalId is required for update" }, { status: 400 });
    }

    const updated = await Product.findOneAndUpdate(
      { originalId: body.originalId },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated }, { status: 200 });
  } catch (error: any) {
    console.error("💥 [API/Products] PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
