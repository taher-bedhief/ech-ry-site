import fetchData from "@/lib/fetchDataFromApi";
import layoutSettings from "@/lib/layoutSettings";
import NoProductFound from "./NoProductFound";
import Paginations from "./Paginations";
import ProductCard from "./cards/ProductCard";
import type { AllProduct } from "@/types/product";

const safeGetArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

type SearchParamsType = Record<string, string | string[] | undefined>;

type CategoryPageProps = {
  searchParams: SearchParamsType;
  params: {
    category: string;
    shop: string;
  };
};

const ProductGrid = async ({ params, searchParams }: CategoryPageProps) => {
  try {
    const { shop, category } = params;

    // ✅ Construction des queryParams (fetchData nettoie les vides)
    const queryParams: Record<string, string> = {
      page: (searchParams?.page as string) || "1",
      q: (searchParams?.q as string) || "",
      sort: (searchParams?.sort as string) || "",
      order: (searchParams?.order as string) || "",
      color: (searchParams?.color as string) || "",
      minPrice: (searchParams?.minPrice as string) || "",
      maxPrice: (searchParams?.maxPrice as string) || "",
    };

    // ✅ N’ajoute shop_category que si ce n’est pas "Select Shop"
    if (shop && shop !== "Select Shop") {
      queryParams.shop_category = shop;
    }

    // ✅ Ajoute category si présent
    if (category) {
      queryParams.category = category;
    }

    console.log("📡 [ProductGrid] Fetch start:", queryParams);

    const res = await fetchData.get("/products", queryParams);

    console.log("📦 [ProductGrid] API raw response:", res);

    const products: AllProduct[] = safeGetArray<AllProduct>(res?.data?.products);
    const totalCount: number = res?.data?.pagination?.total ?? 0;
    const settings = layoutSettings?.[shop] || { productCardVariants: "style-1" };

    console.log("🛒 [ProductGrid] Products length:", products.length);
    console.log("⚙️ [ProductGrid] Layout settings:", settings);

    if (products.length === 0) {
      console.warn("⚠️ [ProductGrid] No products found");
      return <NoProductFound />;
    }

    return (
      <>
        <div className="grid-layout pt-6">
          {products.map((product: AllProduct) => {
            if (!product || !product._id) {
              console.warn("⚠️ [ProductGrid] Invalid product:", product);
              return null;
            }
            console.log("🎨 [ProductGrid] Rendering ProductCard:", product._id);
            return (
              <ProductCard
                product={product}
                variants={settings.productCardVariants}
                key={product._id}
              />
            );
          })}
        </div>
        <Paginations
          totalCount={totalCount}
          currentPage={Number(queryParams.page || 1)}
          totalPages={Math.ceil(totalCount / 10)}
        />
      </>
    );
  } catch (error) {
    console.error("❌ [ProductGrid] Error fetching products:", error);
    return <NoProductFound />;
  }
};

export default ProductGrid;
