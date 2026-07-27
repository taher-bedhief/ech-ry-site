import mongoose, { Schema, Document } from "mongoose";

export interface IWishlistItem {
  _id: string;              // MongoDB ID (toujours présent)
  originalId: string;       // ✅ identifiant stable du produit
  title: string;
  price: number;
  oldPrice?: number;
  promo?: boolean;
  image?: string[];
  shop_category?: string;
  unit_of_measure?: string;
  description?: string;
  categories?: string[];
  rating?: number;
  amount?: number;
  colors?: string[];
  sizes?: string[];
  authors?: string[];
  safeSlug?: string;
}

export interface IWishlist extends Document {
  userEmail: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    _id: { type: String, required: true },          // MongoDB ID
    originalId: { type: String, required: true },   // ✅ obligatoire
    title: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: Number,
    promo: Boolean,
    image: [String],
    shop_category: String,
    unit_of_measure: String,
    description: String,
    categories: [String],
    rating: Number,
    amount: Number,
    colors: [String],
    sizes: [String],
    authors: [String],
    safeSlug: String,
  },
  { _id: false }
);

const WishlistSchema = new Schema<IWishlist>(
  {
    userEmail: { type: String, required: true, unique: true },
    items: { type: [WishlistItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Wishlist ||
  mongoose.model<IWishlist>("Wishlist", WishlistSchema);
