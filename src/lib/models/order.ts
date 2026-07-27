import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

// Adresse
export interface IAddress {
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  address?: string;
}

// Infos utilisateur snapshotées
export interface IUserInfo {
  name?: string;
  email?: string;
  role?: string;
}

// Commande
export interface IOrder extends Document {
  orderNumber: string;
  user: string;
  userInfo?: IUserInfo;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  taxCost: number;
  total: number;
  status:
    | "pending"
    | "processing"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "completed";
  shippingAddress?: IAddress;
  billingAddress?: IAddress;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma des items
const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false }
);

// Schéma des adresses
const addressSchema = new Schema<IAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String },
  },
  { _id: false }
);

// Schéma principal de commande
const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    userInfo: {
      name: { type: String },
      email: { type: String },
      role: { type: String, default: "user" },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    shippingCost: { type: Number, required: true, default: 0 },
    taxCost: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    shippingAddress: { type: addressSchema, required: false },
    billingAddress: { type: addressSchema, required: false },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "confirmed", // ⚡ ajouté pour les paiements cartes
        "shipped",
        "delivered",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Génération automatique d’un numéro de commande unique
orderSchema.pre("validate", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ECH-${Date.now().toString().slice(-6)}-${Math.floor(
      Math.random() * 10000
    )}`;
  }
  next();
});

const Order = models.Order || model<IOrder>("Order", orderSchema);
export default Order;
