import mongoose, { Document, Model, Schema } from "mongoose";

/* =========================
   Interfaces
========================= */

export interface ICartItem {
  product: string;
  quantity: number;
  price: number;
  title?: string; // optionnel si on hydrate depuis le produit
  image?: string[] | string;
  unit_of_measure?: string;
  shop_category?: string;
}

/**
 * ⚠️ Important :
 * On sépare ICart (data) et CartDocument (mongoose)
 */
export interface ICart {
  user: string;
  items: ICartItem[];
  total: number;
}

/**
 * ✅ Document réel Mongoose (save(), _id, etc.)
 */
export interface CartDocument extends ICart, Document {}

/* =========================
   Schemas
========================= */

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: String, 
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    title: String,
    image: { type: [String], default: [] },
    unit_of_measure: String,
    shop_category: String,
  },
  { _id: false }
);

const cartSchema = new Schema<CartDocument>(
  {
    user: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

/* =========================
   Middleware
========================= */

// ✅ Calcul du total avant sauvegarde
cartSchema.pre<CartDocument>("save", function (next) {
  this.total = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  next();
});

/* =========================
   Model
========================= */

const Cart: Model<CartDocument> =
  mongoose.models.Cart || mongoose.model<CartDocument>("Cart", cartSchema);

export default Cart;
