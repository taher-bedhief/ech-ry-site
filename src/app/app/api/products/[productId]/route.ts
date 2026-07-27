import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";
import { requireAuth } from "@/lib/auth/utils";
import type { BaseProduct } from "@/types/product";

// ================= Validation de l’ID =================
function validateProductId(productId: string) {
  if (/^[0-9a-fA-F]{24}$/.test(productId)) {
    return { type: "objectId", value: productId };
  }
  return { type: "originalId", value: productId };
}

// ================= GET =================
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const validation = validateProductId(params.productId);
    await dbConnect();

    let product: BaseProduct | null = null;
    if (validation.type === "objectId") {
      product = await Product.findById(validation.value).lean<BaseProduct>();
    } else {
      product = await Product.findOne({ originalId: validation.value }).lean<BaseProduct>();
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ===== Calcul du status =====
    let status: "Active" | "Warning" | "Inactive" | "OutOfStock";
    if (!product.isActive) status = "Inactive";
    else if ((product.amount ?? 0) === 0) status = "OutOfStock";
    else if ((product.amount ?? 0) <= (product.lowStockThreshold ?? 5)) status = "Warning";
    else status = "Active";

    // ===== Calcul du pourcentage de réduction =====
    let discountPercent = 0;
    if (product.promo && product.oldPrice > 0) {
      discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    }

    return NextResponse.json({ ...product, status, discountPercent });
  } catch (error: any) {
    console.error("❌ Error in GET /api/products/[productId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ================= PUT =================
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const validation = validateProductId(params.productId);
    await dbConnect();
    const body = await request.json();

    let productDoc =
      validation.type === "objectId"
        ? await Product.findById(validation.value)
        : await Product.findOne({ originalId: validation.value });

    if (!productDoc) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const currentOriginalId = productDoc.originalId;

    // ===== Gestion du stock =====
    if (typeof body.stockDelta === "number") {
      productDoc.amount = Math.max(0, (productDoc.amount ?? 0) + body.stockDelta);
    }

    // ===== Activation / Désactivation =====
    if (typeof body.isActive === "boolean") {
      productDoc.isActive = body.isActive;
    }

    // ===== Mise à jour des autres champs =====
    if (body.title) productDoc.title = body.title;
    if (body.description) productDoc.description = body.description;
    if (body.shop_category) productDoc.shop_category = body.shop_category;
    if (body.categories) productDoc.categories = body.categories;
    if (body.unit_of_measure) productDoc.unit_of_measure = body.unit_of_measure;
    if (body.amount) productDoc.amount = body.amount;
    if (body.supplier) productDoc.supplier = body.supplier;
    if (body.lowStockThreshold) productDoc.lowStockThreshold = body.lowStockThreshold;
    if (body.image) productDoc.image = body.image;

    // ===== Gestion du prix avec oldPrice / promo =====
    if (typeof body.price === "number") {
      productDoc.oldPrice = productDoc.price ?? 0; // ancien prix
      productDoc.price = body.price;               // nouveau prix
      productDoc.promo = body.price < (productDoc.oldPrice ?? 0);
    }

    productDoc.originalId = currentOriginalId; // ne jamais changer l’originalId

    await productDoc.save();

    // ===== Calcul du status =====
    let status: "Active" | "Warning" | "Inactive" | "OutOfStock";
    if (!productDoc.isActive) status = "Inactive";
    else if ((productDoc.amount ?? 0) === 0) status = "OutOfStock";
    else if ((productDoc.amount ?? 0) <= (productDoc.lowStockThreshold ?? 5)) status = "Warning";
    else status = "Active";

    // ===== Calcul du pourcentage de réduction =====
    let discountPercent = 0;
    if (productDoc.promo && productDoc.oldPrice > 0) {
      discountPercent = Math.round(((productDoc.oldPrice - productDoc.price) / productDoc.oldPrice) * 100);
    }

    return NextResponse.json({
      success: true,
      product: { ...productDoc.toObject(), status, discountPercent }
    });
  } catch (error: any) {
    console.error("❌ Error in PUT /api/products/[productId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ================= DELETE =================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const validation = validateProductId(params.productId);
    await dbConnect();

    let product =
      validation.type === "objectId"
        ? await Product.findByIdAndDelete(validation.value)
        : await Product.findOneAndDelete({ originalId: validation.value });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: product });
  } catch (error: any) {
    console.error("❌ Error in DELETE /api/products/[productId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
