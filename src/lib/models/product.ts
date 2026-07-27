import mongoose from "mongoose";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import Subscriber from "../models/subscriber";

const productSchema = new mongoose.Schema(
  {
    originalId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    oldPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    promo: {
      type: Boolean,
      required: true,
      default: false,
    },
    categories: [{ type: String }],
    image: [{ type: String }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    shop_category: {
      type: String,
      required: true,
    },
    unit_of_measure: {
      type: String,
    },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    supplier: {
      type: String,
      default: "N/A",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.methods.decrementStock = async function (quantity: number) {
  if (this.amount < quantity) {
    throw new Error("Stock insuffisant");
  }
  this.amount -= quantity;
  this.sales += quantity;
  await this.save();
};

productSchema.methods.incrementStock = async function (quantity: number) {
  this.amount += quantity;
  await this.save();
};

productSchema.methods.reserveStock = async function (quantity: number) {
  if (this.amount < quantity) {
    throw new Error("Stock insuffisant pour réservation");
  }
  this.reserved += quantity;
  await this.save();
};

productSchema.methods.releaseReservedStock = async function (quantity: number) {
  this.reserved = Math.max(0, this.reserved - quantity);
  await this.save();
};

productSchema.post("save", async function (doc) {
  try {
    if (!doc.isNew) return;

    const subscribers = await Subscriber.find({});
    const emails = subscribers.map((s: { email: string }) => s.email);

    if (emails.length === 0) return;

    const emailBody = `
Nouveau produit ajouté sur Ech-Ry 🎉

Nom : ${doc.title}
Prix : ${doc.price} ${doc.unit_of_measure ?? ""}
Catégorie : ${doc.shop_category}
Stock disponible : ${doc.amount}
Note : ${doc.rating}/5

Description :
${doc.description}

Image : ${doc.image?.[0] ?? "Aucune image"}
    `;

    const ses = new SESClient({
      region: process.env.AWS_SES_REGION,
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
      },
    });

    const params = {
      Destination: { ToAddresses: emails },
      Message: {
        Body: { Text: { Data: emailBody } },
        Subject: { Data: `Nouveau produit : ${doc.title}` },
      },
      Source: "no-reply@ech-ry.com",
    };

    await ses.send(new SendEmailCommand(params));
    console.log(
      ${emails.length} abonnés pour le produit ${doc.title}`
    );
  } catch (err) {
    console.error("❌ Erreur envoi SES:", err);
  }
});

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
