// Statuts possibles pour une commande
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "completed"
  | "confirmed"; 

// Statuts possibles pour un paiement
export type PaymentStatus = "pending" | "paid" | "failed";

// Type produit (centralisé)
export type Product = {
  _id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  name?: string;
  originalId?: string;
};

// ===============================
// 🔹 Cas 1 : Snapshot (sans populate)
// ===============================
export type OrderItem = {
  _id?: string;
  productId: string;   // identifiant snapshoté
  title: string;       // titre snapshoté
  image: string;       // image snapshotée
  quantity: number;
  price: number;
  category?: string;   // ex: "gadgets"
  promo?: boolean;     // ex: true si promo active
  oldPrice?: number;   // prix avant promo
};

// ===============================
// 🔹 Cas 2 : Après populate
// ===============================
export type PopulatedOrderItem = {
  _id?: string;
  product: Product;    // produit complet après populate
  quantity: number;
  price: number;
};

// Type adresse
export type Address = {
  fullName: string;
  phone?: string;
  streetAddress?: string;
  address?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;

  email?: string;
};

// ===============================
// 🔹 Infos utilisateur snapshotées
// ===============================
export type UserInfo = {
  name?: string;
  email?: string;
  role?: string;
};

// ===============================
// 🔹 Commande snapshotée
// ===============================
export type Order = {
  _id: string;
  orderNumber: string;
  user: string;
  userInfo?: UserInfo;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;        
  shippingCost: number;    
  taxCost: number;         
  total: number;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
};

// ===============================
// 🔹 Commande après populate
// ===============================
export type PopulatedOrder = {
  _id: string;
  orderNumber: string;
  user: string;
  userInfo?: UserInfo;
  status: OrderStatus;
  items: PopulatedOrderItem[];
  subtotal: number;        
  shippingCost: number;    
  taxCost: number;         
  total: number;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
};

export type BaseOrder = {
  _id?: string;
  orderNumber?: string;
  user?: string;
  userInfo?: UserInfo;
  status?: OrderStatus;
  items?: OrderItem[];
  subtotal?: number;       
  shippingCost?: number;   
  taxCost?: number;        
  total?: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
};
