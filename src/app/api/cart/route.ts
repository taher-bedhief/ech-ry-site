import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cart from "@/lib/models/cart";
import Product from "@/lib/models/product";
import { requireAuth } from "@/lib/auth/utils";
import type { ICartItem, CartDocument } from "@/lib/models/cart";
import { safeGetArray } from "@/utils/safeUtils";

const normalizeId = (id: any) => String(id);

/* =========================
   GET – récupérer le panier
========================= */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    const userKey = auth.email ?? auth.userId;
    const cart: CartDocument | null = await Cart.findOne({ user: userKey });

    if (!cart) return NextResponse.json({ items: [] });

    const productIds = safeGetArray<ICartItem>(cart.items).map((item) =>
      normalizeId(item.product)
    );

    // ✅ Recherche par originalId
    const products = await Product.find({ originalId: { $in: productIds } });
    const productMap = new Map(products.map((p) => [normalizeId(p.originalId), p]));

    const items = safeGetArray<ICartItem>(cart.items).map((item) => {
      const product = productMap.get(normalizeId(item.product));
      return {
        _id: product?._id ?? null,
        originalId: product?.originalId ?? normalizeId(item.product),
        title: product?.title ?? "Produit inconnu",
        price: product?.price ?? item.price ?? 0,
        quantity: item.quantity ?? 1,
        image: product?.image ?? ["/placeholder.jpg"],
        unit_of_measure: item.unit_of_measure ?? "",
        shop_category: item.shop_category ?? "",
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

/* =========================
   POST – ajouter / fusionner
========================= */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    const userKey = auth.email ?? auth.userId;
    const body = await request.json();

    const guestItems: ICartItem[] = safeGetArray<ICartItem>(body.guestItems);
    const { productId, quantity } = body;

    let cart: CartDocument | null = await Cart.findOne({ user: userKey });
    if (!cart) cart = new Cart({ user: userKey, items: [] });

    if (guestItems.length > 0) {
      guestItems.forEach((guestItem) => {
        const existingItem = cart!.items.find(
          (i) => normalizeId(i.product) === normalizeId(guestItem.product)
        );
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          // ✅ Toujours stocker originalId
          cart!.items.push({
            product: normalizeId(guestItem.product),
            quantity: guestItem.quantity,
            price: guestItem.price,
          });
        }
      });
    } else if (productId && quantity) {
      const product = await Product.findOne({ originalId: normalizeId(productId) });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const index = cart.items.findIndex(
        (i) => normalizeId(i.product) === normalizeId(product.originalId)
      );

      if (index > -1) {
        cart.items[index].quantity = quantity;
        cart.items[index].price = product.price;
      } else {
        // ✅ Stocker originalId
        cart.items.push({
          product: product.originalId,
          quantity,
          price: product.price,
        });
      }
    } else {
      return NextResponse.json(
        { error: "Aucun produit à ajouter ou fusionner" },
        { status: 400 }
      );
    }

    await cart.save();

    const productIds = safeGetArray<ICartItem>(cart.items).map((item) =>
      normalizeId(item.product)
    );
    const products = await Product.find({ originalId: { $in: productIds } });
    const productMap = new Map(products.map((p) => [normalizeId(p.originalId), p]));

    const items = safeGetArray<ICartItem>(cart.items).map((item) => {
      const product = productMap.get(normalizeId(item.product));
      return {
        _id: product?._id ?? null,
        originalId: product?.originalId ?? normalizeId(item.product),
        title: product?.title ?? "Produit inconnu",
        price: product?.price ?? item.price ?? 0,
        quantity: item.quantity ?? 1,
        image: product?.image ?? ["/placeholder.jpg"],
        unit_of_measure: item.unit_of_measure ?? "",
        shop_category: item.shop_category ?? "",
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

/* =========================
   DELETE – supprimer un produit OU vider le panier
========================= */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    const userKey = auth.email ?? auth.userId;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (productId) {
      const cart = await Cart.findOne({ user: userKey });
      if (!cart) {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 });
      }

      cart.items = cart.items.filter(
        (item) => normalizeId(item.product) !== normalizeId(productId)
      );

      await cart.save();
      return NextResponse.json({ success: true, cart });
    } else {
      await Cart.findOneAndDelete({ user: userKey });
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
