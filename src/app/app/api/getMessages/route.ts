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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // ✅ On ignore les invités
  if (!userId || userId === "Client") {
    return NextResponse.json({ messages: [] });
  }

  try {
    const client = await getClient();
    const db = client.db("echrydb");
    const conversations = db.collection("conversations");

    const convo = await conversations.findOne({ userId });
    return NextResponse.json({ messages: convo?.messages || [] });
  } catch (err) {
    console.error("Erreur MongoDB :", err);
    return NextResponse.json({ messages: [], error: "Erreur serveur" });
  }
}
