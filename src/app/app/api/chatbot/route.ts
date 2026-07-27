import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import type { AllProduct } from "@/types/product";

/* =====================================================
   CONFIG
===================================================== */

const MONGODB_URI = process.env.MONGODB_URI!;
const HF_API_KEY = process.env.HF_API_KEY || "";
const HF_API_URL =
  "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

/* =====================================================
   NLP CONFIGURATION
===================================================== */

const greetings = ["bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "hey"];
const promoKeywords = ["promo", "promotion", "discount", "sale", "soldes", "offer"];
const recommendationKeywords = ["recommend", "suggest", "propose", "recommande"];
const orderKeywords = ["order", "orders", "mes commandes", "track order", "suivi de commande"];

/* =====================================================
   NLP FUNCTIONS
===================================================== */

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function detectIntent(message: string, categories: string[]) {
  const msg = normalize(message);

  if (greetings.some((w) => msg.includes(w))) return "greeting";
  if (promoKeywords.some((w) => msg.includes(w))) return "promo";
  if (recommendationKeywords.some((w) => msg.includes(w))) return "recommendation";
  if (["cash on delivery", "visa", "mastercard", "payment methods"].includes(msg)) return "payment";
  if (["contact us"].includes(msg)) return "contact";
  if (msg.includes("delivery")) return "delivery";
  if (orderKeywords.some((w) => msg.includes(w))) return "orders";
  if (categories.some((c) => msg.includes(c.toLowerCase()))) return "category";

  if (msg.length <= 15) return "product_search";

  return "fallback";
}

function extractCategory(message: string, categories: string[]) {
  const msg = normalize(message);
  return categories.find((c) => msg.includes(c.toLowerCase()));
}

/* =====================================================
   SUGGESTIONS ENGINE
===================================================== */

function buildSuggestions(intent: string, category?: string, categories?: string[]) {
  switch (intent) {
    case "greeting":
      return [
        "Show products on promotion",
        "Recommend products",
        "What are the delivery times?",
        "Payment Methods",
        "Contact Us",
        "Show my recent orders"
      ];
    case "promo":
      return ["Top 3 best promotions", "Promotions by category", "View all promotions","Back to conversation"];
    case "category":
      return [`Similar products in ${category}`, `Promotions in ${category}`, "Back to conversation"];
    case "recommendation":
      return ["Personalized promotions", "Explore another category", "View new arrivals", "Back to conversation"];
    case "product_search":
      return [
        "View similar products",
        "Show promotions in this category",
        "Back to conversation"
      ];
    case "orders":
      return ["Track my last order", "View all past orders", "Back to conversation"];
    case "payment":
      return ["Back to conversation"];
    case "contact":
      return ["Back to conversation"];
    case "delivery":
      return ["Back to conversation", "Payment Methods", "Contact Us"];
    default:
      return categories?.slice(0, 5).map((c) => `View products in ${c}`) || [];
  }
}

/* =====================================================
   MAIN API
===================================================== */

export async function POST(req: Request) {
  try {
    const { userId, message } = await req.json();

    if (!message || !userId) {
      return NextResponse.json({ reply: "Invalid request." }, { status: 400 });
    }

    const client = await getClient();
    const db = client.db("echrydb");

    const productsCollection = db.collection<AllProduct>("products");
    const ordersCollection = db.collection("orders");
    const conversationsCollection = db.collection("conversations");

    const categories = await productsCollection.distinct("shop_category");

    const intent = detectIntent(message, categories);
    const category = extractCategory(message, categories);

    let reply = "";

    /* ================= GREETING ================= */
    if (intent === "greeting") {
      reply = `Hello ${userId} 👋 How can I help you today?`;
    }

    /* ================= DELIVERY TIMES ================= */
    else if (intent === "delivery") {
      reply = "🚚 Standard delivery times are usually 2–5 working days within Tunisia. For international shipping, it can range from 6 to 18 working days depending on the country.";
      return NextResponse.json({
        reply,
        suggestions: buildSuggestions(intent, category, categories),
      });
    }

    /* ================= PAYMENT METHODS ================= */
    else if (intent === "payment") {
      reply = "💳 Available payment methods:";
      const promosData = [
        { id: "pay-cash", title: "Cash on Delivery", description: "Pay when the order is delivered.", image: "FaTruck" },
        { id: "pay-visa", title: "Visa", description: "Secure online payment using Visa card.", image: "FaCcVisa" },
        { id: "pay-mastercard", title: "MasterCard", description: "Secure online payment using MasterCard.", image: "FaCcMastercard" },
      ];
      return NextResponse.json({
        reply,
        promos: promosData,
        suggestions: buildSuggestions(intent, category, categories),
      });
    }

    /* ================= CONTACT US ================= */
    else if (intent === "contact") {
      reply = "📞 Contact Information:";
      return NextResponse.json({
        reply,
        contact: {
          location: "Ariana, Tunisia",
          email: "tbedhief@gmail.com",
          phone: "+216 23606361",
        },
        suggestions: buildSuggestions(intent, category, categories),
      });
    }

    /* ================= ORDERS ================= */
    else if (intent === "orders") {
      if (!userId || userId === "Client") {
        reply = "⚠️ You must be logged in to view your orders.";
        return NextResponse.json({ reply, suggestions: ["Back to conversation"] });
      }

      const orders = await ordersCollection
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      if (!orders.length) {
        reply = "You have no recent orders.";
        return NextResponse.json({ reply, suggestions: ["Back to conversation"] });
      }

      const ordersData = await Promise.all(
        orders.map(async (o) => {
          const enrichedItems = await Promise.all(
            o.items.map(async (i: any) => {
              const product = await productsCollection.findOne({
                originalId: i.originalId || i.productId
              });

              return {
                productId: i.originalId || i.productId,
                productName: product?.title || i.productName || "Unknown product",
                quantity: i.quantity ?? 1, // ✅ correction ici
                price: i.price,
                image: product?.image?.[0] || i.image || "/placeholder.jpg",
                shop_category: product?.shop_category || i.shop_category || "Uncategorized",
                reserved: product?.reserved ?? i.reserved ?? 0,
                sales: product?.sales ?? i.sales ?? 0
              };
            })
          );

          return {
            orderNumber: o.orderNumber,
            status: o.status,
            total: o.total,
            date: o.createdAt,
            items: enrichedItems
          };
        })
      );

      reply = "📦 Your recent orders:";
      return NextResponse.json({
        reply,
        orders: ordersData,
        suggestions: buildSuggestions(intent, category, categories),
      });
    }

    /* ================= PROMOTIONS ================= */
    else if (intent === "promo") {
      const promos = await productsCollection.find({ promo: true }).limit(20).toArray();
      const promosData = promos.map((p) => ({
        id: p.originalId || p._id,
        title: p.title,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.oldPrice && p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0,
        image: Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : "/placeholder.jpg",
        amount: p.amount ?? 0,
        available: (p.amount ?? 0) > 0,
        shop_category: p.shop_category || "Uncategorized",
        reserved: p.reserved ?? 0,
        sales: p.sales ?? 0
      }));
      return NextResponse.json({
        reply: "🔥 Promotions:",
        promos: promosData,
        suggestions: buildSuggestions(intent, category, categories),
      });
    }

        /* ================= PRODUCT SEARCH ================= */
    else if (intent === "product_search") {
      const keyword = message.trim();
      const list = await productsCollection.find({
        title: { $regex: keyword, $options: "i" },
      }).limit(5).toArray();

      if (!list.length) {
        reply = `No product found with keyword "${keyword}".`;
      } else {
        const productsData = list.map((p) => ({
          id: p.originalId || p._id, // 🔎 toujours originalId
          title: p.title,
          price: p.price,
          oldPrice: p.oldPrice,
          promo: p.promo || false,
          discount: p.oldPrice && p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0,
          image: Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : "/placeholder.jpg",
          amount: p.amount ?? 0,
          available: (p.amount ?? 0) > 0,
          shop_category: p.shop_category || "Uncategorized",
          reserved: p.reserved ?? 0,
          sales: p.sales ?? 0
        }));
        return NextResponse.json({
          reply: "🔎 Products found:",
          promos: productsData,
          suggestions: [
            "View similar products",
            "Show promotions in this category",
            "Back to conversation"
          ],
        });
      }
    }

    /* ================= CATEGORY SEARCH ================= */
    else if (intent === "category" && category) {
      const list = await productsCollection.find({ shop_category: category }).limit(5).toArray();

      reply =
        list.length === 0
          ? "No products found in this category."
          : `🛒 Products in ${category}:\n` +
            list.map((p) => `- ${p.title}: ${p.price} TND`).join("\n");

      return NextResponse.json({
        reply,
        promos: list.map((p) => ({
          id: p.originalId || p._id,
          title: p.title,
          price: p.price,
          oldPrice: p.oldPrice,
          discount: p.oldPrice && p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0,
          image: Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : "/placeholder.jpg",
          amount: p.amount ?? 0,
          available: (p.amount ?? 0) > 0,
          shop_category: p.shop_category || "Uncategorized",
          reserved: p.reserved ?? 0,
          sales: p.sales ?? 0
        })),
        suggestions: [
          "View similar products",
          "Show promotions in this category",
          "Back to conversation"
        ],
      });
    }

    /* ================= RECOMMENDATION ================= */
    else if (intent === "recommendation") {
      const history = await conversationsCollection.findOne({ userId });

      let preferredCategory = category;

      if (!preferredCategory && history?.messages?.length) {
        const lastMessages = history.messages
          .slice(-5)
          .map((m: any) => normalize(m.text));

        preferredCategory = categories.find((c) =>
          lastMessages.some((msg: string) => msg.includes(c.toLowerCase()))
        );
      }

      const recommended = await productsCollection
        .find(preferredCategory ? { shop_category: preferredCategory } : {})
        .limit(3)
        .toArray();

      reply =
        recommended.length === 0
          ? "I need more interaction to personalize recommendations."
          : "🤖 Recommended for you:\n" +
            recommended.map((p) => `- ${p.title}: ${p.price} TND`).join("\n");

      return NextResponse.json({
        reply,
        promos: recommended.map((p) => ({
          id: p.originalId || p._id,
          title: p.title,
          price: p.price,
          oldPrice: p.oldPrice,
          discount: p.oldPrice && p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0,
          image: Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : "/placeholder.jpg",
          amount: p.amount ?? 0,
          available: (p.amount ?? 0) > 0,
          shop_category: p.shop_category || "Uncategorized",
          reserved: p.reserved ?? 0,
          sales: p.sales ?? 0
        })),
        suggestions: [
          ...buildSuggestions(intent, category, categories),
          "Back to conversation"
        ],
      });
    }

    /* ================= FALLBACK AI ================= */
    else {
      if (!HF_API_KEY) {
        reply = "AI service unavailable.";
      } else {
        const hfRes = await fetch(HF_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: message }),
        });

        const hfData = await hfRes.json();
        reply = hfData?.[0]?.generated_text || "I'm thinking about your question...";
      }
    }

    /* ================= SAVE HISTORY ================= */
    if (userId !== "Client") {
      await conversationsCollection.updateOne(
        { userId },
        {
          $push: {
            messages: {
              $each: [
                { sender: userId, text: message, timestamp: new Date() },
                { sender: "EchRy", text: reply, timestamp: new Date() },
              ],
            },
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      reply,
      suggestions: buildSuggestions(intent, category, categories),
      actions: [
        {
          type: "clear_conversation",
          label: "⬅ Back to conversation",
          description: "Return to chat after viewing products",
        },
      ],
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ reply: "⚠️ Internal server error." }, { status: 500 });
  }
}
