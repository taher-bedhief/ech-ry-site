import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscriber from "@/lib/models/subscriber";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await dbConnect();

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already subscribed" }, { status: 400 });
    }

    const subscriber = new Subscriber({ email });
    await subscriber.save();

    const host = req.headers.get("host") || "";
    const isDev = host.includes("localhost");

    if (isDev) {
      console.log(`DEV MODE: email would be sent to ${email}`);
      return NextResponse.json({ success: true, dev: true });
    }

    const ses = new SESClient({
      region: process.env.AWS_SES_REGION || "eu-west-3",
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
      },
    });

    const params = {
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Text: {
            Data: "Thank you for subscribing to Ech-Ry 🎉 You will now receive our latest news and offers.",
          },
        },
        Subject: { Data: "Welcome to Ech-Ry" },
      },
      Source: "no-reply@ech-ry.com",
    };

    await ses.send(new SendEmailCommand(params));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error in subscribe API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
