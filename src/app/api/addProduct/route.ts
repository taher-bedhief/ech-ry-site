import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product"; 
import Subscriber from "@/lib/models/subscriber"; 
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export async function POST(req: Request) {
  try {
    const { name, description, price } = await req.json();

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    await dbConnect();

    const product = new Product({ name, description, price });
    await product.save();

    const subscribers = await Subscriber.find({});

    const ses = new SESClient({
      region: process.env.AWS_SES_REGION || "eu-west-3",
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
      },
    });

    for (const sub of subscribers) {
      const params = {
        Destination: { ToAddresses: [sub.email] },
        Message: {
          Body: {
            Text: {
              Data: `Hello!\n\nA new product has just been added to Ech-Ry:\n\n${product.name}\n${product.description || ""}\nPrice: ${product.price} TND\n\nVisit our site to discover more!`,
            },
          },
          Subject: { Data: "New product available on Ech-Ry 🎉" },
        },
        Source: "no-reply@ech-ry.com", 
      };

      await ses.send(new SendEmailCommand(params));
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (err) {
    console.error("❌ Error in addProduct API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
