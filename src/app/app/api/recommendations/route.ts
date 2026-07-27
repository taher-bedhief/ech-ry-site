import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uri = process.env.MONGODB_URI!;
let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

// ================= PIPELINES =================
function buildPurchaseRecommendationPipeline(userId: string) {
  return [
    { $match: { userId } },
    { $unwind: "$products" },
    { $match: { "products.purchased": { $gt: 0 } } },
    {
      $lookup: {
        from: "products",
        let: {
          purchasedCategory: "$products.category",
          purchasedShopCategory: "$products.shop_category",
          purchasedId: "$products.productId"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $in: ["$$purchasedCategory", "$categories"] },
                      { $eq: ["$shop_category", "$$purchasedShopCategory"] }
                    ]
                  },
                  { $ne: ["$originalId", "$$purchasedId"] }
                ]
              }
            }
          },
          { $limit: 10 }
        ],
        as: "similarProducts"
      }
    },
    { $unwind: "$similarProducts" },
    {
      $group: {
        _id: "$userId",
        recommendations: { $push: "$similarProducts" }
      }
    }
  ];
}

function buildInteractionRecommendationPipeline(userId: string) {
  return [
    { $match: { userId } },
    { $unwind: "$products" },
    {
      $addFields: {
        "products.score": {
          $add: [
            { $multiply: ["$products.views", 0.1] },
            { $multiply: ["$products.clicks", 0.4] },
            { $multiply: ["$products.wishlist", 0.6] },
            { $multiply: ["$products.rating", 0.3] }
          ]
        }
      }
    },
    { $sort: { "products.score": -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "originalId",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        _id: 0,
        productId: "$products.productId",
        score: "$products.score",
        title: "$productDetails.title",
        categories: "$productDetails.categories",
        shop_category: "$productDetails.shop_category",
        price: "$productDetails.price",
        oldPrice: "$productDetails.oldPrice",
        promo: "$productDetails.promo",
        image: "$productDetails.image"
      }
    },
    {
      $group: {
        _id: "$userId",
        recommendations: { $push: "$$ROOT" }
      }
    }
  ];
}

// ================= ROUTE =================
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const type = req.nextUrl.searchParams.get("type") || "interaction";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const client = await getClient();
    const db = client.db("echrydb");

    const pipeline =
      type === "purchase"
        ? buildPurchaseRecommendationPipeline(userId)
        : buildInteractionRecommendationPipeline(userId);

    const result = await db.collection("productAnalytics").aggregate(pipeline).toArray();

    return NextResponse.json({
      success: true,
      items: result[0]?.recommendations || []
    });
  } catch (error) {
    console.error("❌ [recommendations] API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
