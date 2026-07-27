import { promises as fs } from "fs";
import path from "path";
import mongoose, { Schema } from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://easyshop-mongodb:27017/easyshop";

// --- Interface produit ---
interface Product {
  _id: string;
  originalId: string;
  title: string;
  description?: string;
  price: number;
  oldPrice?: number;
  categories?: string[];
  image?: string[];
  rating?: number;
  amount: number;
  shop_category: string;
  unit_of_measure?: string;
  colors?: string[];
  sizes?: string[];
}

// --- Schéma Mongoose ---
const productSchema = new Schema(
  {
    _id: { type: String },
    originalId: { type: String },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    oldPrice: Number,
    categories: [String],
    image: [String],
    rating: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    shop_category: { type: String, required: true },
    unit_of_measure: String,
    colors: [String],
    sizes: [String],
  },
  {
    timestamps: true,
    _id: false, // désactive ObjectId auto-généré
  }
);

// ✅ FIX DÉFINITIF DU MODÈLE (IMPORTANT)
const ProductModel =
  mongoose.models.Product ??
  mongoose.model<Product>("Product", productSchema);

// --- Fonction utilitaire pour corriger les chemins d’images ---
function getImagePath(originalPath: string, shopCategory: string): string {
  const fileName = path.basename(originalPath);

  const categoryMap: Record<string, string> = {
    electronics: "gadgetsImages",
    medicine: "medicineImages",
    grocery: "groceryImages",
    clothing: "clothingImages",
    furniture: "furnitureImages",
    books: "books",
    beauty: "makeupImages",
    snacks: "groceryImages",
    bakery: "bakeryImages",
    bags: "bagsImages",
  };

  const imageDir = categoryMap[shopCategory] ?? `${shopCategory}Images`;
  return `/${imageDir}/${fileName}`;
}

// --- Script principal ---
async function migrateData() {
  try {
    console.log("Attempting to connect to MongoDB:", MONGODB_URI);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB connected");

    const projectRoot = path.resolve(__dirname, "..");

    const jsonData = await fs.readFile(
      path.join(projectRoot, ".db", "db.json"),
      "utf-8"
    );

    const data = JSON.parse(jsonData);

    await ProductModel.deleteMany({});
    console.log("Existing products cleared");

    const usedIds = new Set<string>();

    const products = data.products.map((product: any) => {
      let paddedId = product.id.padStart(10, "0");

      while (usedIds.has(paddedId)) {
        paddedId = (Number(paddedId) + 1).toString().padStart(10, "0");
      }

      usedIds.add(paddedId);

      const fixedImages = product.image?.map((img: string) =>
        getImagePath(img, product.shop_category)
      );

      return {
        ...product,
        _id: paddedId,
        originalId: paddedId,
        image: fixedImages,
      };
    });

    await ProductModel.insertMany(products);
    console.log(`Migrated ${products.length} products`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

migrateData();
