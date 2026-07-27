import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, products = [] } = body;

    if (!userId || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await getClient();
    const db = client.db("echrydb");
    const productAnalyticsCollection = db.collection("productAnalytics");

    // =========================
    // CAS MULTI-PRODUITS (purchase)
    // =========================
    if (type === "purchase" && Array.isArray(products) && products.length > 0) {
      let totalPurchasedQty = 0;

      for (const product of products) {
        const {
          productId,
          productName,
          category,
          promo,
          price,
          oldPrice,
          quantity,
          image,
          rating,
        } = product;

        const qty = quantity && quantity > 0 ? quantity : 1;
        totalPurchasedQty += qty;

        const productImage = Array.isArray(image) ? image[0] : image || "/placeholder.jpg";

        const existing = await productAnalyticsCollection.findOne({
          userId,
          "products.productId": productId,
        });

        const baseSet = {
          "products.$.productName": productName,
          "products.$.category": category ?? "unknown",
          "products.$.promo": promo ?? false,
          "products.$.price": price ?? 0,
          "products.$.oldPrice": oldPrice ?? 0,
          "products.$.image": productImage,
          updatedAt: new Date(),
        };

        if (existing) {
          const existingProduct = existing.products.find((p: any) => p.productId === productId);
          await productAnalyticsCollection.updateOne(
            { userId, "products.productId": productId },
            {
              $inc: { "products.$.purchased": qty },
              $set: {
                ...baseSet,
                "products.$.rating": rating ?? existingProduct?.rating ?? 0,
              },
            }
          );
        } else {
          await productAnalyticsCollection.updateOne(
            { userId },
            {
              $push: {
                products: {
                  productId,
                  productName,
                  category: category ?? "unknown",
                  views: 0,
                  clicks: 0,
                  wishlist: 0,
                  purchased: qty,
                  rating: rating ?? 0,
                  promo: promo ?? false,
                  price: price ?? 0,
                  oldPrice: oldPrice ?? 0,
                  image: productImage,
                },
              },
              $set: { updatedAt: new Date() },
            },
            { upsert: true }
          );
        }
      }

      await productAnalyticsCollection.updateOne(
        { userId },
        {
          $inc: { purchasedTotal: totalPurchasedQty },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );
    } else {
      // =========================
      // CAS SINGLE EVENT
      // =========================
      const {
        productId,
        productName,
        category,
        promo,
        price,
        oldPrice,
        quantity,
        image,
        rating,
      } = body;

      const qty = quantity && quantity > 0 ? quantity : 1;
      const productImage = Array.isArray(image) ? image[0] : image || "/placeholder.jpg";

      let updateField = "";
      if (type === "view") updateField = "products.$.views";
      else if (type === "click") updateField = "products.$.clicks";
      else if (type === "wishlist") updateField = "products.$.wishlist";
      else if (type === "purchase") updateField = "products.$.purchased";
      else if (type === "rating") updateField = "products.$.rating";

      const existing = await productAnalyticsCollection.findOne({
        userId,
        "products.productId": productId,
      });

      const baseSet = {
        "products.$.productName": productName,
        "products.$.category": category ?? "unknown",
        "products.$.promo": promo ?? false,
        "products.$.price": price ?? 0,
        "products.$.oldPrice": oldPrice ?? 0,
        "products.$.image": productImage,
        updatedAt: new Date(),
      };

      if (existing) {
        const updateQuery: any = { $set: baseSet };

        if (type === "purchase") {
          updateQuery.$inc = { [updateField]: qty };
        } else if (type === "rating") {
          updateQuery.$set["products.$.rating"] = rating ?? 0;
        } else {
          updateQuery.$inc = { [updateField]: 1 };
        }

        await productAnalyticsCollection.updateOne(
          { userId, "products.productId": productId },
          updateQuery
        );
      } else {
        await productAnalyticsCollection.updateOne(
          { userId },
          {
            $push: {
              products: {
                productId,
                productName,
                category: category ?? "unknown",
                views: type === "view" ? 1 : 0,
                clicks: type === "click" ? 1 : 0,
                wishlist: type === "wishlist" ? 1 : 0,
                purchased: type === "purchase" ? qty : 0,
                rating: type === "rating" ? (rating ?? 0) : 0,
                promo: promo ?? false,
                price: price ?? 0,
                oldPrice: oldPrice ?? 0,
                image: productImage,
              },
            },
            $set: { updatedAt: new Date() },
          },
          { upsert: true }
        );
      }

      if (type === "purchase") {
        await productAnalyticsCollection.updateOne(
          { userId },
          {
            $inc: { purchasedTotal: qty },
            $set: { updatedAt: new Date() },
          },
          { upsert: true }
        );
      }
    }

    const updatedDoc = await productAnalyticsCollection.findOne({ userId });
    return NextResponse.json({ success: true, data: updatedDoc });
  } catch (error) {
    console.error("❌ [route.ts] API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
