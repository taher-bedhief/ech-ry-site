import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId || userId === "Client") {
      return NextResponse.json({
        suggestions: [
          "Show products on promotion",
          "Recommend products",
          "What are the delivery times?",
        ],
      });
    }

    const client = await getClient();
    const db = client.db("echrydb");

    await db.collection("conversations").updateOne(
      { userId },
      { $set: { messages: [] } }
    );

    return NextResponse.json({
      suggestions: [
        "Show products on promotion",
        "Recommend products",
        "What are the delivery times?",
      ],
    });
  } catch (error) {
    console.error("Clear conversation error:", error);
    return NextResponse.json(
      { suggestions: ["⚠️ Unable to load suggestions."] },
      { status: 500 }
    );
  }
}
