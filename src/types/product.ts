// ================= GROCERY =================
export type GroceryProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  unit_of_measure: string;
  shop_category: string;
  amount: number;
  rating: number;
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= GADGET =================
export type GadgetProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  rating: number;
  amount: number;
  shop_category: string;
  unit_of_measure: string;
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= BAKERY =================
export type BakeryProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  rating: number;
  amount: number;
  shop_category: string;
  unit_of_measure: string;
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= CLOTHING =================
export type ClothingProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  rating: number;
  amount: number;
  shop_category: string;
  unit_of_measure: string;
  colors: string[];
  sizes: string[];
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= MAKEUP =================
export type MakeupProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  rating: number;
  amount: number;
  shop_category: string;
  unit_of_measure: string;
  colors: string[];
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= BAGS =================
export type BagsProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  rating: number;
  amount: number;
  shop_category: string;
  unit_of_measure: string;
  colors: string[];
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= BOOKS =================
export type BooksProduct = {
  _id: string;
  originalId: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  authors?: string[];
  categories?: string[];
  image?: string[];
  rating?: number;
  amount?: number;
  shop_category: string;
  unit_of_measure?: string;
  safeSlug?: string;
  isActive?: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold?: number;
  supplier?: string;
};

// ================= MEDICINE =================
export type MedicineProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories: string[];
  image: string[];
  rating: number;
  amount: number;
  shop_category: string;
  unit_of_measure: string;
  colors: string[];
  isActive: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  supplier?: string;
};

// ================= UNION DES PRODUITS =================
export type AllProduct = {
  _id: string;
  originalId: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories?: string[];
  image?: string[];
  rating?: number;
  amount?: number;
  shop_category: string;
  unit_of_measure?: string;
  authors?: string[];
  colors?: string[];
  sizes?: string[];
  safeSlug?: string;
  isActive?: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold?: number;
  supplier?: string;
};

// ================= TYPE PRATIQUE POUR SINGLE PRODUCT =================
export type SingleProductType = BaseProduct;

// ================= TYPE BASE =================
export type BaseProduct = {
  _id: string;
  originalId: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  promo: boolean;
  categories?: string[];
  image?: string[];
  rating?: number;
  amount: number;
  shop_category: string;
  unit_of_measure?: string;
  colors?: string[];
  sizes?: string[];
  authors?: string[];
  safeSlug?: string;
  isActive?: boolean;
  reserved: number;
  sales: number;
  lowStockThreshold?: number;
  supplier?: string;
};

// ================= RÉPONSE API =================
export type ProductResponse = {
  products: AllProduct[];
  total: number;
  skip?: number;
  limit?: number;
};

// ================= PRODUIT EN PROMO AVEC % =================
export type PromoProduct = AllProduct & {
  discount: number;
};
