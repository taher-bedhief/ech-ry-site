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
  const { userId, sender, text } = await req.json();
  const timestamp = new Date().toISOString();

  // ✅ On ignore les invités
  if (!userId || userId === "Client") {
    return NextResponse.json({ success: false, message: "Guest messages are not stored" });
  }

  try {
    const client = await getClient();
    const db = client.db("echrydb");
    const conversations = db.collection("conversations");

    await conversations.updateOne(
      { userId },
      { $push: { messages: { sender, text, timestamp } } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur MongoDB :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" });
  }
}
