
export type SearchParamsType = { 
  [key: string]: string | string[] | undefined; 
};

export type GroceryProduct = {
  _id: string;
  originalId: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  categories: string[];
  image: string[];
  unit_of_measure: string;
  shop_category: string;
};

export type GadgetProduct = GroceryProduct & {
  rating: number;
  amount: number;
};

export type BakeryProduct = GroceryProduct & {
  rating: number;
  amount: number;
};

export type ClothingProduct = GroceryProduct & {
  rating: number;
  amount: number;
  colors: string[];
  sizes: string[];
};

export type MakeupProduct = GroceryProduct & {
  rating: number;
  amount: number;
  colors: string[];
};

export type BagsProduct = GroceryProduct & {
  rating: number;
  amount: number;
  colors: string[];
};

export type BooksProduct = GroceryProduct & {
  authors: string[];
  rating: number;
  amount: number;
};

export type MedicineProduct = GroceryProduct & {
  rating: number;
  amount: number;
  colors: string[];
};

export interface AllProduct {
  _id: string;
  originalId: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  categories?: string[];
  image?: string[];
  unit_of_measure?: string;
  shop_category?: string;

  // Champs optionnels selon la catégorie
  rating?: number;
  amount?: number;
  colors?: string[];
  sizes?: string[];
  authors?: string[];
}

export type SingleProductType = GroceryProduct &
  GadgetProduct &
  BakeryProduct &
  ClothingProduct &
  MakeupProduct &
  BagsProduct &
  BooksProduct &
  MedicineProduct;

import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string; // champ custom
    user: {
      id?: string;
      name?: string;
      email?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
  }
}
