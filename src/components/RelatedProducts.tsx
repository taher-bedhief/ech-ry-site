"use client";

import { useEffect, useState } from "react";
import fetchData from "@/lib/fetchDataFromApi";
import layoutSettings from "@/lib/layoutSettings";
import ProductCard from "./cards/ProductCard";
import type { AllProduct } from "@/types/product";

// 🔒 Helper pour sécuriser les tableaux
const safeGetArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

// 🔧 Mapping des catégories pour éviter les incohérences
const categoryMap: Record<string, string> = {
  makeup: "beauty",
  cosmetics: "beauty",
  "beauty-care": "beauty",
  beauty: "beauty",
  snacks: "snacks",
  grocery: "grocery",
  gadgets: "gadgets",
  bakery: "bakery",
  clothing: "clothing",
  bags: "bags",
  furniture: "furniture",
  books: "books",
  medicine: "medicine",
};

type RelatedProductsProps = {
  category: string;
  shop_category: string;
};

const RelatedProducts = ({ category, shop_category }: RelatedProductsProps) => {
  const [products, setProducts] = useState<AllProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Normalisation de la catégorie
  const normalizedShopCategory = categoryMap[shop_category] || shop_category;

  useEffect(() => {
    const loadProducts = async () => {
      if (!category || !shop_category) {
        console.warn("⚠️ RelatedProducts skipped due to invalid params", {
          category,
          shop_category,
        });
        return;
      }

      try {
        if (process.env.NODE_ENV === "development") {
          console.log("📡 [RelatedProducts] Fetch start:", {
            category,
            shop_category,
            normalizedShopCategory,
            url: `/products/${normalizedShopCategory}/${category}`,
          });
        }

        const res = await fetchData.get(`/products/${normalizedShopCategory}/${category}`, {
          limit: "5",
        });

        const fetchedProducts = safeGetArray<AllProduct>(res?.data?.products);
        setProducts(fetchedProducts);

        if (process.env.NODE_ENV === "development") {
          console.log("🛒 [RelatedProducts] Products array length:", fetchedProducts.length);
        }
      } catch (err) {
        console.error("❌ [RelatedProducts] Fetch failed", {
          category,
          shop_category,
          error: err,
        });
        setError(`Impossible de charger les produits liés pour ${normalizedShopCategory}.`);
      }
    };

    loadProducts();
  }, [category, shop_category, normalizedShopCategory]);

  const settings = layoutSettings?.[normalizedShopCategory];

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!products.length) {
    return (
      <p className="text-gray-500">
        Aucun produit disponible pour la section {normalizedShopCategory}.
      </p>
    );
  }

  if (!settings) {
    console.warn("⚠️ [RelatedProducts] No layout settings found", {
      normalizedShopCategory,
    });
    return (
      <p className="text-gray-500">
        Aucun paramétrage d’affichage pour {normalizedShopCategory}.
      </p>
    );
  }

  return (
    <>
      {products.map((product: AllProduct) => {
        if (!product || !product._id) {
          console.warn("⚠️ [RelatedProducts] Produit invalide:", product);
          return null;
        }
        return (
          <ProductCard
            key={product._id}
            product={product}
            variants={settings.productCardVariants}
          />
        );
      })}
    </>
  );
};

export default RelatedProducts;
