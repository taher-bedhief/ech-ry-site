import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Order from "@/lib/models/order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await dbConnect();
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "paid",
          status: "processing",
        });
        console.log(`✅ Order ${orderId} marked as paid`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
